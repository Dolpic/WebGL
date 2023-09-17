export default class Framebuffer{
    constructor(glContext, size, texture, type=WebGL2RenderingContext.TEXTURE_2D){
        this.gl = glContext
        this.size = size
        this.fb = this.gl.createFramebuffer()
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb)
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, type, texture, 0)
    }

    use(){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb)
        this.gl.viewport(0, 0, this.size.width, this.size.height)
    }
}