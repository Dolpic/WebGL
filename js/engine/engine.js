import Objects from "./Objects.js"
import Textures from "./Textures.js"
import Scene from "./Scene/Scene.js"

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
        
        this.objects  = new Objects(this.gl)
        this.textures = new Textures(this.gl)
        
        const screenSize = {width:this.gl.canvas.clientWidth, height:this.gl.canvas.clientHeight}
        this.scene = new Scene(this.gl, screenSize, this.textures, this.params)

        if(this.params.with_shadow_map){
            this.scene.createShadowMap(this.params.shadow_map_size)
            this.scene.createOmniShadowMap(this.params.shadow_map_size)
        }
    }
    
    setDefaultParams(params){
        let result = {}
        let defaults = {
            "depth_test": true,
            "depth_test_function": WebGL2RenderingContext.LEQUAL,
            "clear_color": [0.0, 0.0, 0.0, 1.0],
            "clear_depth": 1.0,
            "with_shadow_map" : true,
            "show_shadow_map" : false,
            "shadow_map_size" : {width:512, height:512}
        }
        for(const prop in defaults){
            result[prop] = params.hasOwnProperty(prop) ? params[prop] : defaults[prop]
        }
        return result
    }
    
    getViewProjection(){
        return this.scene.camera.getState()
    }
    
    setObjectTransform(name, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        this.objects.setTransform(name, position, rotation, scale)
    }
    
    addObject(obj, name, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        this.objects.add(obj, name, position, rotation, scale)
    }
    
    setViewProjection(view, projection=null){
        this.mainScene.camera.setMatrixView(view)
        if(projection != null) this.mainScene.camera.setMatrixProjection(projection)
    }
    
    setSkybox(folder){
        this.scene.setSkybox(folder)
    }
    
    render() {
        this.scene.createTextures(this.objects.getTexturesToCreate())
        this.scene.render(this.objects.list)
    }
}