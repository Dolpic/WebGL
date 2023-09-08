import "./gl-matrix.js"

export default class Program{
    constructor(engine, shaders){
        this.engine = engine
        this.gl = engine.gl

        this.program = this.gl.createProgram()
        this.gl.attachShader(this.program, this.compileShader(this.gl.VERTEX_SHADER,   shaders.vertex))
        this.gl.attachShader(this.program, this.compileShader(this.gl.FRAGMENT_SHADER, shaders.fragment))
        this.gl.bindAttribLocation(this.program, 0, "aPosition");
        this.gl.bindAttribLocation(this.program, 1, "aColor");
        this.gl.bindAttribLocation(this.program, 2, "aNormal");
        this.gl.bindAttribLocation(this.program, 3, "aTexCoord");
        this.gl.linkProgram(this.program)
        this.gl.useProgram(this.program)
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            alert('Error initializing the program : ' + this.gl.getProgramInfoLog(this.program))
        }
    }

    compileShader(type, source) {
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
    
    clearAndDraw(objects, mode=this.gl.TRIANGLES){
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
        this.draw(objects, mode)
    }

    draw(objects, mode=this.gl.TRIANGLES){
        for(const obj_name in objects){
            const obj = objects[obj_name]
            this.setMatrix4(this.engine.matrices_names.model, obj.modelMatrix)
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

}
