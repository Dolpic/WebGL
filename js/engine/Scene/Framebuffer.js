export default class Framebuffer{
    constructor(glContext, width, height, texture, attachement=WebGL2RenderingContext.COLOR_ATTACHMENT0, type=WebGL2RenderingContext.TEXTURE_2D){
        this.gl = glContext
        this.size = {width:width, height:height}
        this.fb = this.gl.createFramebuffer()
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb)
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, attachement, type, texture, 0)
    }

    use(){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb)
        this.gl.viewport(0, 0, this.size.width, this.size.height)
    }
}