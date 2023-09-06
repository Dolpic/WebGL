import "./gl-matrix.js"

export default class Program{
    constructor(engine, shaders){
        this.engine = engine
        this.gl = engine.gl

        this.program = this.gl.createProgram()
        this.gl.attachShader(this.program, this.createCompileShader(this.gl.VERTEX_SHADER,   shaders.vertex))
        this.gl.attachShader(this.program, this.createCompileShader(this.gl.FRAGMENT_SHADER, shaders.fragment))
        this.gl.linkProgram(this.program)
        this.gl.useProgram(this.program)
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            alert('Error initializing the program : ' + this.gl.getProgramInfoLog(this.program))
        }
    }

    createCompileShader(type, source) {
        let shader = this.gl.createShader(type)
        this.gl.shaderSource(shader, source)
        this.gl.compileShader(shader)
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            alert('Error compiling the shaders: ' + this.gl.getShaderInfoLog(shader))
        }
        return shader
    }

    setMatrix4(name, value, transpose=false){
        this.gl.useProgram(this.program)
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, name), transpose, value)
    }

    setVec3(name, value){
        this.gl.useProgram(this.program)
        this.gl.uniform3fv(this.gl.getUniformLocation(this.program, name), value)
    }

    setTextureUnit(name, value){
        this.gl.useProgram(this.program)
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), value)
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

}