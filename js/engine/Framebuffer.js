import Camera from "./Camera.js"
import Program from "./Program.js"

export default class Framebuffer{
    constructor(engine, shaders){
        this.engine = engine
        this.gl = engine.gl
        this.camera = new Camera(engine)
        this.program = new Program(engine, shaders)
        this.list = {
            "main": {fb:null, size:engine.canvasSize}
        }
    }

    create(name, width, height, texture=null){ // Strange to have a constructor and a create function
        const fb = this.gl.createFramebuffer()
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb)
        this.list[name] = {fb:fb, size:{width:width, height:height}}
        if(texture != null){
            this.setTexture(name, texture)
        }
    }

    setTexture(name, texture){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.list[name].fb)
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, texture, 0)
        this.texture = texture
    }

    setCamera(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        this.camera.setCamera(position, rotation, scale, this.program)
    }

    setProjection(fov=45, zNear=0.1, zFar=200.0){
        this.camera.setProjection(fov, zNear, zFar, this.program)
    }

    setOrthoProjection(left, right, bottom, top, near, far){
        this.camera.setOrthoProjection(left, right, bottom, top, near, far, this.program)
    }

    getCameraMatrices(){
        return this.camera.getMatrices()
    }

    use(name){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.list[name].fb)
        this.gl.viewport(0, 0, this.list[name].size.width, this.list[name].size.height)
    }
}