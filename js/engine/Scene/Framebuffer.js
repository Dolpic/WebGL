export default class Framebuffer{
    constructor(glContext, size, texture){
        this.gl = glContext
        this.size = size
        this.fb = this.gl.createFramebuffer()
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb)
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, texture, 0)
    }

    use(){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb)
        this.gl.viewport(0, 0, this.size.width, this.size.height)
    }
}