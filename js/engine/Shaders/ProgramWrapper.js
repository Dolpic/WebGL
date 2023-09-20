import shadersWriter from "./ShadersWriter.js"
import * as Utils from "../utils.js"

export default class Program{
    constructor(glContext, Shaders){
        this.gl = glContext
        this.shaders = Shaders
        this.program = null
    }

    createProgram(){
        this.program = this.gl.createProgram()
        this.gl.attachShader(this.program, this._compileShader(this.gl.VERTEX_SHADER,   this.shaders.getVertex()))
        this.gl.attachShader(this.program, this._compileShader(this.gl.FRAGMENT_SHADER, this.shaders.getFragment()))
        this.gl.linkProgram(this.program)
        this.gl.useProgram(this.program)  
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            alert('Error initializing the program : ' + this.gl.getProgramInfoLog(this.program))
        }
    }

    setMatrix4(name, value, transpose=false){
        this.gl.useProgram(this.program)
        if(value != null) this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, name), transpose, value)
    }

    setVec3(name, value){
        this.gl.useProgram(this.program)
        if(value != null) this.gl.uniform3fv(this.gl.getUniformLocation(this.program, name), value)
    }

    setFloat(name, value){
        this.gl.useProgram(this.program)
        if(value != null) this.gl.uniform1f(this.gl.getUniformLocation(this.program, name), value)
    }

    setTextureUnit(name, value){
        this.gl.useProgram(this.program)
        if(value != null) this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), value)
    }
    
    clearAndDraw(objects, mode=this.gl.TRIANGLES){
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
        this.draw(objects, mode)
    }

    draw(objects, mode=this.gl.TRIANGLES){
        for(const obj_name in objects){
            const obj = objects[obj_name]
            this.setMatrix4(Utils.names.mat.model, obj.modelMatrix)
            this.gl.bindVertexArray(obj.vao)
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
