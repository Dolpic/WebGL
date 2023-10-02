import "../gl-matrix.js"
import * as Utils from "../utils.js"
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

        this.programs.createProgram("debug", "fullred")
    }

    createTexture(image, location, with_mipmap){
        const tex = this.textures.create(image, with_mipmap)
        let params = {}
        params[location] = tex
        this.programs.setShaderParams(params)
    }

    createTextures(textureList){
         // TODO now only one texture can be registered
        textureList.forEach(t => this.createTexture(t, "uTexture", true))
    }

    useDefaultFramebuffer(){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
        this.gl.viewport(0, 0, this.screenSize.width, this.screenSize.height)
    }

    createShadowMap(size){
        this.programs.createProgram("dirShadowmap", "shadowmap")
        const depthTexture = this.textures.createDepthTexture(size)
        this.programs.setShaderParams({uDirShadowMap: depthTexture})
        this.shadowMap = {
            texture : depthTexture.texture,
            framebuffer : new Framebuffer(this.gl, size.width, size.height, depthTexture.texture, this.gl.DEPTH_ATTACHMENT),
            lightMatrix : glMatrix.mat4.create(),
            camera  : new Camera(() => {}, size),
        }
        this.shadowMap.camera.setOrthoProjection(-10, 10, -10, 10, 0.1, 200)
        this.programs.setShaderParams({uMatProjection: this.shadowMap.camera.getState().projection}, "dirShadowmap")
    }

    useShadowMap(){
        const state = this.lights.getState()
        this.shadowMap.camera.setCamera(state.conePosition, state.coneDirDegree)
        const camMatrices = this.shadowMap.camera.getState()
        Utils.transformMatrix(this.shadowMap.lightMatrix, [0.5,0.5,0.5], [0,0,0], [0.5,0.5,0.5])
        glMatrix.mat4.multiply(this.shadowMap.lightMatrix, this.shadowMap.lightMatrix, camMatrices.projection)
        glMatrix.mat4.multiply(this.shadowMap.lightMatrix, this.shadowMap.lightMatrix, camMatrices.view)
        this.params.show_shadow_map ? this.useDefaultFramebuffer() : this.shadowMap.framebuffer.use() 
        this.programs.setShaderParams({uMatView: camMatrices.view}, "dirShadowmap")
        this.programs.setShaderParams({uMatDirShadowMap: this.shadowMap.lightMatrix})
    }

    createOmniShadowMap(size){
        this.programs.createProgram("omniShadowmap", "shadowmap")
        const depthTexture = this.textures.createDepthTexture(size, this.gl.TEXTURE_CUBE_MAP)
        this.programs.setShaderParams({uOmniShadowMap: depthTexture})
        this.omniShadowMap = {
            framebuffers :  [
                new Framebuffer(this.gl, size.width, size.height, depthTexture.texture, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X),
                new Framebuffer(this.gl, size.width, size.height, depthTexture.texture, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X),
                new Framebuffer(this.gl, size.width, size.height, depthTexture.texture, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y),
                new Framebuffer(this.gl, size.width, size.height, depthTexture.texture, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y),
                new Framebuffer(this.gl, size.width, size.height, depthTexture.texture, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z),
                new Framebuffer(this.gl, size.width, size.height, depthTexture.texture, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z),
            ]
        }
    }

    renderOmniShadowMap(objects){
        this.renderCubemap(this.lights.getState().pointPosition, this.omniShadowMap.framebuffers, objects, "omniShadowmap")
    }

    renderCubemap(position, framebuffers, objects, program="default"){
        if(this.cubemapCamera == undefined){
            this.cubemapCamera = new Camera(()=>{})
            this.cubemapCamera.setProjection(this.params.shadow_map_size.width/this.params.shadow_map_size.height, 90)
        }
        this.programs.setShaderParams({uMatProjection: this.cubemapCamera.getState().projection}, program)

        const rotations = [
            [0, -90, 180],  
            [0, 90, 180],   

            [90, 0, 0], 
            [90, 180, 180],

            [180, 0, 0], 
            [0, 0, 180], 
        ]
        for(let i=0; i<6; i++){
            this.cubemapCamera.setCamera(position, rotations[i])
            this.programs.setShaderParams({uMatView: this.cubemapCamera.getState().view}, program)
            framebuffers[i].use()
            this.programs.clear()
            this.renderSkybox(this.cubemapCamera)
            this.programs.draw(objects, program)
        }
    }

    setSkybox(folder){
        this.programs.createProgram("skybox", "skybox")
        this.skybox = {
            vao :        this.gl.createVertexArray(),
            name:        "skybox", 
            count:       6, 
            modelMatrix: Utils.createMatrix()
        }
        this.gl.bindVertexArray(this.skybox.vao)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer())
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,1,1, 1,1,1, -1,-1,1, 1,1,1, 1,-1,1, -1,-1,1]), this.gl.STATIC_DRAW)
        const positionLocation = 0
        this.gl.enableVertexAttribArray(positionLocation)
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0) 
        const tex = this.textures.createCubemap(folder)
        this.programs.setShaderParams({uSkybox: tex}, "skybox")
        this.defaultReflectionCubemap = tex
    }

    renderSkybox(camera=this.camera){
        let viewProjection = glMatrix.mat4.create()
        let cameraState = camera.getState()
        glMatrix.mat4.multiply(viewProjection, cameraState.projection, cameraState.view)
        this.programs.setShaderParams({uViewProjection: viewProjection}, "skybox")
        this.programs.draw([this.skybox], "skybox")
    }

    render(objects){
        for(const obj_name in objects.getList()){
            //objects.useReflectionMap(obj_name, this.defaultReflectionCubemap)
        }

        if(this.shadowMap != null){
            this.useShadowMap()
            this.programs.clearAndDraw(objects.getList(), "dirShadowmap")
            this.renderOmniShadowMap(objects.getList())
        }

        for(let i=1; objects.getObjectWithReflectionLevel(i) != undefined; i++){
            let objs = objects.getObjectWithReflectionLevel(i)
            if(objs != undefined){
                objs.forEach(obj => {
                    //console.log("Rendering "+obj.name+" pass "+i)
                    this.renderCubemap(
                        objects.getPosition(obj.name), 
                        objects.getReflectionFramebuffers(obj.name), 
                        objects.getListExcept(obj.name),
                    )
                    objects.useReflectionMap(obj.name, obj.ownReflectionMap)
                })
            }
        }

        if(!this.params.show_shadow_map){
            this.programs.setShaderParams({uMatView: this.camera.getState().view})
            this.programs.setShaderParams({uMatProjection: this.camera.getState().projection})
            this.useDefaultFramebuffer()
            this.programs.clearAndDraw(objects.getList())
            if(this.skybox != null){
                this.renderSkybox()
            }
        }
    }
}