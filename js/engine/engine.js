import Objects  from "./Objects.js"
import Textures from "./Textures.js"
import Scene    from "./Scene/Scene.js"
import Skybox from "./Skybox.js"
import ProgramWrapper from "./Shaders/ProgramWrapper.js"

export default class RenderingEngine{
    constructor(canvas, params={}){
        if (! (this.gl = canvas.getContext("webgl2")) ){
            alert("WebGL2 is not supported on this browser")
        }
        this.params = this.setDefaultParams(params)
        this.gl.clearColor(...this.params.clear_color) 
        this.gl.clearDepth(this.params.clear_depth)
        
        this.params.depth_test ? this.gl.enable(this.gl.DEPTH_TEST) : this.gl.disable(this.gl.DEPTH_TEST)
        this.gl.depthFunc(this.params.depth_test_function)

        this.defaultMaterial = {
            specularColor:    [1,1,1],
            specularPower:    2.5,
            reflectionFactor: 0,
            reflectionLevel:  1
        }

        this.programs = new ProgramWrapper(this.gl)
        this.textures = new Textures(this.gl, this.params)
        this.skybox   = null
        this.objects  = new Objects(this.gl, this.textures, this, obj => {
            if(this.skybox != null){
                this.objects.useReflectionMap(obj.name, this.skybox.skybox.texture)
            }
        })
        
        const screenSize = {width:this.gl.canvas.clientWidth, height:this.gl.canvas.clientHeight}
        this.scene = new Scene(this.gl, screenSize, this.programs, this.textures, this.params)

        if(this.params.with_shadow_map){
            this.scene.createShadowMap()
            this.scene.createOmniShadowMap()
        }
    }
    
    setDefaultParams(params){
        let result = {}
        let defaults = {
            "depth_test":          true,
            "depth_test_function": WebGL2RenderingContext.LEQUAL,
            "clear_color":         [0.0, 0.0, 0.0, 1.0],
            "clear_depth":         1.0,
            "with_shadow_map":     true,
            "show_shadow_map":     false,
            "texture_size":        {width:800, height:800}
        }
        for(const prop in defaults){
            result[prop] = params.hasOwnProperty(prop) ? params[prop] : defaults[prop]
        }
        return result
    }
    
    getViewProjection(){
        return this.scene.camera.getState()
    }
    
    setSkybox(folder){
        this.skybox = new Skybox(this.gl, this.programs, this.textures, folder)
        for(const obj_name in this.objects.getList()){
            this.objects.useReflectionMap(obj_name, this.skybox.skybox.texture)
        }
    }
    
    render() {
        this.scene.createTextures(this.objects.getTexturesToCreate())
        this.scene.render(this.objects, this.skybox)
    }
}