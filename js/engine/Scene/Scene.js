import "../gl-matrix.js"
import * as Utils from "../utils.js"
import Program from "../old/Program.js"
import Camera from "./Camera.js"
import Lights from "./Lights.js"
import Framebuffer from "./Framebuffer.js"
import ProgramWrapper from "../Shaders/ProgramWrapper.js"

export default class Scene{
    constructor(glContext, screenSize, textures, params){
        this.gl         = glContext
        this.screenSize = screenSize
        this.params     = params

        this.textures = textures
        this.programs = new ProgramWrapper(glContext)
        
        this.camera = new Camera(state => this.programs.setShaderParams({
            uMatView:       state.view,
            uMatProjection: state.projection
        }), screenSize.width/screenSize.height)

        this.lights = new Lights(state => this.programs.setShaderParams({
            uLightAmbientColor:  state.ambientColor,
            uLightDirColor:      state.directionalColor,
            uLightDirDir:        state.directionalDir,
            uLightPointColor:    state.pointColor,
            uLightPointPosition: state.pointPosition,
            uLightConeColor:     state.coneColor,
            uLightConePosition:  state.conePosition,
            uLightConeDir:       state.coneDir
        }))

        this.shadowMap   = null
        this.skybox      = null
    }

    createTexture(image, location, with_mipmap){
        const tex = this.textures.create(image, with_mipmap)
        let params = {}
        params[location] = tex
        this.programs.setShaderParams(params)
    }

    setMaterial(specular, reflection){
        this.programs.setShaderParams({
            uLightPointSpecularColor : [1,1,1],
            uLightPointSpecularPower : specular,
            uReflectionFactor : reflection
        })
    }

    createTextures(textureList){
         // TODO now only one texture can be registered
        textureList.forEach(t => this.createTexture(t, "uTexture"))
    }

    createDepthTexture(location, size, type=this.gl.TEXTURE_2D){
        return this.textures.createDepthTexture(location, this.programs, size, type)
    }

    createCubemap(folder){
        this.textures.createCubemap(folder, this.programs)
    }

    useDefaultFramebuffer(){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
        this.gl.viewport(0, 0, this.screenSize.width, this.screenSize.height)
    }

    useShadowMap(){
        const state = this.lights.getState()
        this.shadowMap.camera.setCamera(state.conePosition, state.coneDirection)
        if(this.params.show_shadow_map){
            this.useDefaultFramebuffer()
        }else{
            this.shadowMap.framebuffer.use() 
        }

        Utils.transformMatrix(this.shadowMap.lightMatrix, [0.5,0.5,0.5], [0,0,0], [0.5,0.5,0.5])
        const camMatrices = this.shadowMap.camera.getState()
        glMatrix.mat4.multiply(this.shadowMap.lightMatrix, this.shadowMap.lightMatrix, camMatrices.projection)
        glMatrix.mat4.multiply(this.shadowMap.lightMatrix, this.shadowMap.lightMatrix, camMatrices.view)
        this.programs.setMatrix4(Utils.names.mat.shadowMap, this.shadowMap.lightMatrix)
    }

    useOmniShadowMap(objects){
        const point = this.lights.getState().pointPosition

        const cameraRotations = [
            [0, -90, 180],  
            [0, 90, 180],   

            [90, 0, 0], 
            [90, 180, 180],

            [180, 0, 0], 
            [0, 0, 180], 
        ]


        for(let i=0; i<6; i++){
            this.omniShadowMap.camera.setCamera(point.position, cameraRotations[i])
            this.omniShadowMap.framebuffers[i].use() 
            this.omniShadowMap.program.clearAndDraw(objects)
        }

        Utils.transformMatrix(this.omniShadowMap.lightMatrix, [0.5,0.5,0.5], [0,0,0], [0.5,0.5,0.5])
        const camMatrices = this.omniShadowMap.camera.getState()
        glMatrix.mat4.multiply(this.omniShadowMap.lightMatrix, this.omniShadowMap.lightMatrix, camMatrices.projection)
        glMatrix.mat4.multiply(this.omniShadowMap.lightMatrix, this.omniShadowMap.lightMatrix, camMatrices.view)
        this.programs.setMatrix4(Utils.names.mat.omniShadowMap, this.omniShadowMap.lightMatrix)
    }

    createShadowMap(shaders, size){
        const program = new Program(this.gl, shaders)
        const depthTexture = this.createDepthTexture(Utils.names.tex.shadowMap, size)
        this.shadowMap = {
            program : program,
            texture : depthTexture.texture,
            camera  : new Camera(program, size),
            framebuffer : new Framebuffer(this.gl, size, depthTexture.texture),
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
                new Framebuffer(this.gl, size, depthTexture.texture, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X),
                new Framebuffer(this.gl, size, depthTexture.texture, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X),
                new Framebuffer(this.gl, size, depthTexture.texture, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y),
                new Framebuffer(this.gl, size, depthTexture.texture, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y),
                new Framebuffer(this.gl, size, depthTexture.texture, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z),
                new Framebuffer(this.gl, size, depthTexture.texture, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z),
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
            this.programs.clearAndDraw(objects)
            if(this.skybox != null){
                this.renderSkybox()
            }
        }
    }
}