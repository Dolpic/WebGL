import "../gl-matrix.js"
import * as Utils from "../utils.js"
import Program from "../Program.js"
import Camera from "./Camera.js"
import Lights from "./Lights.js"
import Framebuffer from "./Framebuffer.js"
import ProgramWrapper from "../Shaders/ProgramWrapper.js"

export default class Scene{
    constructor(glContext, screenSize, shaders, textures, params){
        this.gl         = glContext
        this.screenSize = screenSize
        this.params     = params

        this.textures = textures
        this.program = new Program(this.gl, shaders)

        this.camera = new Camera(this.program, screenSize.width/screenSize.height)
        this.lights = new Lights(this.program)
        this.shadowMap   = null
        this.skybox      = null

        this.wrapper = new ProgramWrapper(glContext)
    }

    createTexture(image, location, with_mipmap){
        return this.textures.create(image, location, this.program, with_mipmap)
    }

    createTextures(textureList){
         // TODO now only one texture can be registered
        textureList.forEach(t => this.createTexture(t, "uTexture"))
    }

    createDepthTexture(location, size, type=this.gl.TEXTURE_2D){
        return this.textures.createDepthTexture(location, this.program, size, type)
    }

    createCubemap(folder){
        this.textures.createCubemap(folder, this.program)
    }

    useDefaultFramebuffer(){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
        this.gl.viewport(0, 0, this.screenSize.width, this.screenSize.height)
    }

    useShadowMap(){
        const cone = this.lights.getCone()
        this.shadowMap.camera.setCamera(cone.position, cone.direction)
        if(this.params.show_shadow_map){
            this.useDefaultFramebuffer()
        }else{
            this.shadowMap.framebuffer.use() 
        }

        Utils.transformMatrix(this.shadowMap.lightMatrix, [0.5,0.5,0.5], [0,0,0], [0.5,0.5,0.5])
        const camMatrices = this.shadowMap.camera.getMatrices()
        glMatrix.mat4.multiply(this.shadowMap.lightMatrix, this.shadowMap.lightMatrix, camMatrices.projection)
        glMatrix.mat4.multiply(this.shadowMap.lightMatrix, this.shadowMap.lightMatrix, camMatrices.view)
        this.program.setMatrix4(Utils.names.mat.shadowMap, this.shadowMap.lightMatrix)
    }

    useOmniShadowMap(objects){
        const point = this.lights.getPoint()

        const cameraRotations = [
            [0, -90, 180],  // OK
            [0, 90, 180],   // OK

            [90, 0, 0], // OK
            [90, 180, 180],  // Could be improved

            [180, 0, 0], 
            [0, 0, 180], // OK
        ]

        /*
            [0,   0,   0],
            [180, 0,   0],
            [0,   0,   90],
            [0,   0,   270],
            [0,   90,  0],
            [0,   270, 0]
            ---
            [270, 0, 90],
            [270, 0, 270],
            [270, 0, 0],
            [270, 0, 180],
            [0,   0, 0],
            [180, 0, 0]
        */

        for(let i=0; i<6; i++){
            this.omniShadowMap.camera.setCamera(point.position, cameraRotations[i])
            this.omniShadowMap.framebuffers[i].use() 
            this.omniShadowMap.program.clearAndDraw(objects)
        }
        /*this.omniShadowMap.camera.setCamera(point.position, cameraRotations[1])
        this.useDefaultFramebuffer()
        this.omniShadowMap.program.clearAndDraw(objects)*/

        Utils.transformMatrix(this.omniShadowMap.lightMatrix, [0.5,0.5,0.5], [0,0,0], [0.5,0.5,0.5])
        const camMatrices = this.omniShadowMap.camera.getMatrices()
        glMatrix.mat4.multiply(this.omniShadowMap.lightMatrix, this.omniShadowMap.lightMatrix, camMatrices.projection)
        glMatrix.mat4.multiply(this.omniShadowMap.lightMatrix, this.omniShadowMap.lightMatrix, camMatrices.view)
        this.program.setMatrix4(Utils.names.mat.omniShadowMap, this.omniShadowMap.lightMatrix)
    }

    createShadowMap(shaders, size){
        const program = new Program(this.gl, shaders)
        const depthTexture = this.createDepthTexture(Utils.names.tex.shadowMap, size)
        this.shadowMap = {
            program : program,
            texture : depthTexture,
            camera  : new Camera(program, size),
            framebuffer : new Framebuffer(this.gl, size, depthTexture),
            lightMatrix : glMatrix.mat4.create()
        }
        this.shadowMap.camera.setOrthoProjection(-10, 10, -10, 10, 0.1, 200)
    }

    createOmniShadowMap(shaders, size){
        const program = new Program(this.gl, shaders)
        const depthTexture = this.createDepthTexture(Utils.names.tex.omniShadowMap, size, this.gl.TEXTURE_CUBE_MAP)
        this.omniShadowMap = {
            program : program,
            texture : depthTexture,
            camera  : new Camera(program, size),
            framebuffers :  [
                new Framebuffer(this.gl, size, depthTexture, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X),
                new Framebuffer(this.gl, size, depthTexture, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X),
                new Framebuffer(this.gl, size, depthTexture, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y),
                new Framebuffer(this.gl, size, depthTexture, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y),
                new Framebuffer(this.gl, size, depthTexture, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z),
                new Framebuffer(this.gl, size, depthTexture, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z),
            ],
            lightMatrix : glMatrix.mat4.create()
        }
        //this.omniShadowMap.camera.setOrthoProjection(-10, 10, -10, 10, 0.1, 200)
        this.omniShadowMap.camera.setProjection(this.screenSize.width/this.screenSize.height, 90)
    }

    renderShadowMap(objects){
        this.useShadowMap()
        this.shadowMap.program.clearAndDraw(objects)
    }

    renderOmniShadowMap(objects){
        this.useOmniShadowMap(objects)
    }

    setMaterial(specular, reflection){
        this.program.setVec3("specularColor", [1,1,1])
        this.program.setFloat("specularPower", specular)
        this.program.setFloat("reflectionFactor", reflection)
    }

    setSkybox(shaders, folder){
        this.skybox = {
            program : new Program(this.gl, shaders),
            vao : this.gl.createVertexArray()
        }
        this.gl.bindVertexArray(this.skybox.vao)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer())
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,1,1, 1,1,1, -1,-1,1, 1,1,1, 1,-1,1, -1,-1,1]), this.gl.STATIC_DRAW)
        const aPositionLocation = 0
        this.gl.enableVertexAttribArray(aPositionLocation)
        this.gl.vertexAttribPointer(aPositionLocation, 3, this.gl.FLOAT, false, 0, 0) 
        this.textures.createCubemap(folder, this.skybox.program)
    }

    renderSkybox(){
        let viewProjection = glMatrix.mat4.create()
        glMatrix.mat4.multiply(viewProjection, this.camera.projection, this.camera.view)
        this.skybox.program.setMatrix4("uViewProjection", viewProjection)
        this.gl.bindVertexArray(this.skybox.vao)
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
    }

    render(objects){
        if(this.shadowMap != null){
            this.renderShadowMap(objects)
            this.renderOmniShadowMap(objects)
        }

        if(!this.params.show_shadow_map){
            this.useDefaultFramebuffer()
            this.program.clearAndDraw(objects)
            if(this.skybox != null){
                this.renderSkybox()
            }
        }
    }
}