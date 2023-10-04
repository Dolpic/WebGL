import * as Utils from "./utils.js"

export default class Skybox{
    constructor(glContext, programs, textures, folder){
        this.gl = glContext
        this.programs = programs
        this.textures = textures

        let program = "skybox"
        this.programs.createProgram(program, program)

        let vao = this.gl.createVertexArray()
        this.gl.bindVertexArray(vao)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer())
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER, 
            new Float32Array([-1,1,1, 1,1,1, -1,-1,1, 1,1,1, 1,-1,1, -1,-1,1]), 
            this.gl.STATIC_DRAW
        )

        const positionLocation = 0
        this.gl.enableVertexAttribArray(positionLocation)
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0) 

        const tex = this.textures.createCubemap(folder)
        this.programs.setShaderParams({uSkybox: tex}, "skybox")

        this.skybox = {
            vao:vao, 
            count:6, 
            modelMatrix: Utils.createMatrix(),
            viewProjectionMatrix: Utils.createMatrix(),
            texture:tex, 
            program:program
        }
    }

    render(camera){
        this.programs.setShaderParams({uViewProjection: camera.getState().viewProjection}, this.skybox.program)
        this.programs.draw({"skybox":this.skybox}, this.skybox.program)
    }
}