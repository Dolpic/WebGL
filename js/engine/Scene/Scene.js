import "../gl-matrix.js"
import * as Utils from "../utils.js"
import Camera from "./Camera.js"
import Lights from "./Lights.js"

export default class Scene{
    constructor(glContext, screenSize, programs, textures, params){
        this.gl         = glContext
        this.screenSize = screenSize
        this.params     = params
        this.programs   = programs
        this.textures   = textures
        
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

        let size = this.params.cubemap_size
        this.cubemap = {
            camera:new Camera(()=>{}, size.width/size.height, [0,0,0], [0,0,0], [1,1,1], 90),
            rotations : [
                [0, -90, 180],  
                [0, 90, 180],   
                [90, 0, 0],  
                [-90, 0, 0],
                [180, 0, 0], 
                [0, 0, 180], 
            ]
        }
    }

    createTexture(image, location, with_mipmap){
        let params = {}
        params[location] = this.textures.create(image, with_mipmap)
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
        this.shadowMap = {
            texture:      this.textures.createDepthTexture(size),
            lightMatrix : glMatrix.mat4.create(),
            camera:       new Camera(() => {}, size.width/size.height),
        }
        this.shadowMap.camera.setOrthoProjection(-10, 10, -10, 10, 0.1, 200)
        this.programs.setShaderParams({uDirShadowMap: this.shadowMap.texture})
        this.programs.setShaderParams({uMatProjection: this.shadowMap.camera.getState().projection}, "dirShadowmap")
    }

    useShadowMap(){
        const state = this.lights.getState()
        this.shadowMap.camera.setCamera(state.conePosition, state.coneDirDegree)
        const camMatrices = this.shadowMap.camera.getState()
        Utils.transformMatrix(this.shadowMap.lightMatrix, [0.5,0.5,0.5], [0,0,0], [0.5,0.5,0.5])
        glMatrix.mat4.multiply(this.shadowMap.lightMatrix, this.shadowMap.lightMatrix, camMatrices.projection)
        glMatrix.mat4.multiply(this.shadowMap.lightMatrix, this.shadowMap.lightMatrix, camMatrices.view)
        this.params.show_shadow_map ? this.useDefaultFramebuffer() : this.shadowMap.texture.framebuffer.use() 
        this.programs.setShaderParams({uMatView: camMatrices.view}, "dirShadowmap")
        this.programs.setShaderParams({uMatDirShadowMap: this.shadowMap.lightMatrix})
    }

    createOmniShadowMap(size){
        this.programs.createProgram("omniShadowmap", "shadowmap")
        // TODO Unify size as int and as {width, height}
        this.omniShadowMap = this.textures.createEmptyCubemap(size.width, "depth")
        this.programs.setShaderParams({uOmniShadowMap: this.omniShadowMap})
    }

    renderOmniShadowMap(objects){
        this.renderCubemap(this.lights.getState().pointPosition, this.omniShadowMap.framebuffers, objects, null, "omniShadowmap")
    }

    renderCubemap(position, framebuffers, objects, skybox=null, program="default"){
        this.programs.setShaderParams({uMatProjection: this.cubemap.camera.getState().projection}, program)
        for(let i=0; i<6; i++){
            this.cubemap.camera.setCamera(position, this.cubemap.rotations[i])
            this.programs.setShaderParams({uMatView: this.cubemap.camera.getState().view}, program)
            framebuffers[i].use()
            this.programs.clear()
            if(skybox != null){
                skybox.render(this.cubemap.camera)
            }
            this.programs.draw(objects, program)
        }
    }

    render(objects, skybox=null){
        if(this.shadowMap != null){
            this.useShadowMap()
            this.programs.clearAndDraw(objects.getList(), "dirShadowmap")
            this.renderOmniShadowMap(objects.getList())
        }

        for(let i=1; objects.getObjectWithReflectionLevel(i) != undefined; i++){
            let objs = objects.getObjectWithReflectionLevel(i)
            if(objs != undefined){
                objs.forEach(obj => {
                    this.renderCubemap(
                        objects.getPosition(obj.name), 
                        objects.getReflectionFramebuffers(obj.name), 
                        objects.getListExcept(obj.name),
                        skybox
                    )
                    objects.useReflectionMap(obj.name, obj.cubemap)
                })
            }
        }

        if(!this.params.show_shadow_map){
            this.programs.setShaderParams({uMatView: this.camera.getState().view})
            this.programs.setShaderParams({uMatProjection: this.camera.getState().projection})
            this.useDefaultFramebuffer()
            this.programs.clearAndDraw(objects.getList())
            if(skybox != null){
                skybox.render(this.camera)
            }
        }
    }
}