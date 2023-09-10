import Camera from "./Camera.js"
import Lights from "./Lights.js"
import Program from "../Program.js"
import {Framebuffer, DefaultFramebuffer} from "./Framebuffer.js"

export default class Scene{
    constructor(engine, shaders){
        this.gl = engine.getGlContext()
        this.program = new Program(this.gl, shaders)
        this.camera  = new Camera(this.program, engine.getScreen().ratio)
        this.lights  = new Lights(this.program)
        this.framebuffer = new DefaultFramebuffer(this.gl, engine.getScreen().size)
    }

    setFramebuffer(size, texture){
        this.framebuffer = new Framebuffer(this.gl, size, texture)
    }

    render(objects){
        this.framebuffer.use()
        this.program.clearAndDraw(objects)
    }
}