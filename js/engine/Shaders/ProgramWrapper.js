import Shaders from "./Shaders.js"

export default class ProgramWrapper{
    constructor(glContext){
        this.gl = glContext

        this.program = this.gl.createProgram()
        this.shaders = new Shaders(this.gl, this.program)

        this.createShaders()

        this.gl.attachShader(this.program, this._compileShader(this.gl.VERTEX_SHADER,   this.shaders.getVertex()))
        this.gl.attachShader(this.program, this._compileShader(this.gl.FRAGMENT_SHADER, this.shaders.getFragment()))
        this.gl.linkProgram(this.program)
        this.gl.useProgram(this.program)  

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            alert('Error initializing the program : ' + this.gl.getProgramInfoLog(this.program))
        }
    }

    createShaders(){
        let vao = this.shaders.createVAO()
        let mat = this.shaders.createDefaultMatrices(vao.position, vao.normal)
        //let cmap = this.shaders.createCubemap()
        this.shaders.createTexture(false)//true, mat.view, mat.vNormal, mat.surfaceToCam, cmap.cubemap)
        this.shaders.createAmbientLight()
        this.shaders.createDirectionalLight(mat.view3)
        let pointLight = this.shaders.createPointLight(mat.view3, mat.modelPosition, true, mat.surfaceToCam)
        this.shaders.createConeLight(mat.view3)
        //this.shaders.createDirectionalShadowMap(mat.modelPosition)
        //this.shaders.createOmniShadowMap(mat.modelPosition, pointLight.model_lightToSurface)
        console.log(this.shaders.getVertex() + this.shaders.getFragment())
    }
    
    setShaderParams(params){
        this.shaders.setShaderParams(params)
    }

    clearAndDraw(objects, mode=this.gl.TRIANGLES){
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
        this.draw(objects, mode)
    }

    draw(objects, mode=this.gl.TRIANGLES){
        for(const obj_name in objects){
            const obj = objects[obj_name]
            this.shaders.setVAO(obj.vao)
            this.shaders.setShaderParams({uMatModel:obj.modelMatrix})
            this.gl.drawArrays(mode, 0, obj.count)
        }
    }

    printDebugInfos(){
        console.log("Program informations :")
        console.log("Attributes : ")
        for(let i=0; i<this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES); i++){
          console.log(this.gl.getActiveAttrib(this.program, i))
        }
        console.log("Uniforms : ")
        for(let i=0; i<this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS); i++){
          console.log(this.gl.getActiveUniform(this.program, i))
        }
        console.log("Shaders : ")
        console.log(this.gl.getAttachedShaders(this.program))
    }

    _compileShader(type, source) {
        let shader = this.gl.createShader(type)
        this.gl.shaderSource(shader, source)
        this.gl.compileShader(shader)
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            alert('Error compiling the shaders: ' + this.gl.getShaderInfoLog(shader))
        }
        return shader
    }
}
