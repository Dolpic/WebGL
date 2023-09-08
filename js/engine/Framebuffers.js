import Program from "./Program.js"
import Camera from "./Camera.js"

export default class Framebuffers{
    constructor(engine, shaders){
        this.gl = engine.gl
        this.engine = engine

        const program = new Program(this.engine, shaders)
        this.list = {
            "main": {
                fb:null, 
                size:engine.canvasSize,
                program: program,
                camera: new Camera(this.engine, program)
            }
        }
    }

    new(name, width, height, shaders, texture){
        const fb = this.gl.createFramebuffer()
        const program = new Program(this.engine, shaders)
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb)
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, texture, 0)
        this.list[name] = {
            fb:fb, 
            size:{
                width:width, 
                height:height
            },
            program:program,
            camera:new Camera(this.engine, program)
        }
    }

    use(name){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.list[name].fb)
        this.gl.viewport(0, 0, this.list[name].size.width, this.list[name].size.height)
    }

    clearAndDraw(name, objects){
        this.use(name)
        this.list[name].program.clearAndDraw(objects)
    }
}