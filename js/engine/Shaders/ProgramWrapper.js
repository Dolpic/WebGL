import Shaders from "./Shaders.js"

export default class ProgramWrapper{
    constructor(glContext){
        this.gl = glContext
        this.programs = {}
        this.createProgram("default", "default")
    }

    createProgram(name="default", shaders_type="default"){
        let program = this.gl.createProgram()
        let shaders = new Shaders(this.gl, program)
        this.programs[name] = {
            program: program,
            shaders: shaders
        }
        switch(shaders_type){
            case "default":
                this.generateDefaultShaders(shaders)
                break
            case "skybox":
                this.generateSkyBox(shaders)
                break
            case "shadowmap":
                this.generateShadowmap(shaders)
                break
            default:
                console.warn("Invalid shader type : "+shaders_type)
        }
        console.log(shaders.getVertex() + shaders.getFragment())
        
        this.gl.attachShader(program, this._compileShader(this.gl.VERTEX_SHADER,   shaders.getVertex()))
        this.gl.attachShader(program, this._compileShader(this.gl.FRAGMENT_SHADER, shaders.getFragment()))
        this.gl.linkProgram(program)
        this.gl.useProgram(program)  
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            alert('Error initializing the program : ' + this.gl.getProgramInfoLog(program))
        }
    }

    generateDefaultShaders(shaders){
        let vao = shaders.createVAO()
        let mat = shaders.createDefaultMatrices(vao.position, vao.normal)
        shaders.createReflection(mat.view, mat.vNormal, mat.surfaceToCam)
        shaders.createTexture()
        shaders.createAmbientLight()
        shaders.createDirectionalLight(mat.view3)
        let pointLight = shaders.createPointLight(mat.view3, mat.modelPosition, true, mat.surfaceToCam)
        shaders.createConeLight(mat.view3)
        shaders.createDirectionalShadowMap(mat.modelPosition)
        shaders.createOmniShadowMap(pointLight.model_lightToSurface)
    }

    generateSkyBox(shaders){
        shaders.createSkyBox()
    }

    generateShadowmap(shaders){
        shaders.createShadowmap()

    }
    
    setShaderParams(params, program_name="default"){
        this.programs[program_name].shaders.setShaderParams(params)
    }

    clearAndDraw(objects, program_name="default", mode=this.gl.TRIANGLES){
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
        this.draw(objects, program_name, mode)
    }

    /*printDebugInfos(){
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
    }*/

    draw(objects, program_name="default", mode=this.gl.TRIANGLES){
        let prog = this.programs[program_name]
        this.gl.useProgram(prog.program)  
        for(const obj_name in objects){
            const obj = objects[obj_name]
            prog.shaders.setVAO(obj.vao)
            prog.shaders.setShaderParams({uMatModel:obj.modelMatrix})
            this.gl.drawArrays(mode, 0, obj.count)
        }
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
