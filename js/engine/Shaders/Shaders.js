import ShadersWriter, {Types} from "./ShadersWriter.js"

export default class Shaders{
    constructor(glContext, program){
        this.gl = glContext
        this.program = program
        this.shaderWriter = new ShadersWriter
    }


    setMatrix4(name, value, transpose=false){
        this.gl.useProgram(this.program)
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, name), transpose, value)
    }

    setVec3(name, value){
        this.gl.useProgram(this.program)
        this.gl.uniform3fv(this.gl.getUniformLocation(this.program, name), value)
    }

    setFloat(name, value){
        this.gl.useProgram(this.program)
        this.gl.uniform1f(this.gl.getUniformLocation(this.program, name), value)
    }

    setTextureUnit(name, value){
        this.gl.useProgram(this.program)
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), value)
    }


    createVAO(){
        this.shaderWriter.addVertexAttribute(Types.vec4, "aPosition")
        this.shaderWriter.addVertexAttribute(Types.vec4, "aColor")
        this.shaderWriter.addVertexAttribute(Types.vec3, "aNormal")
        this.shaderWriter.addVertexAttribute(Types.vec2, "aTexCoord")
        this.shaderWriter.addVertexOut(Types.vec4, "vColor", "aColor")
        this.shaderWriter.addVertexOut(Types.vec2, "vTextureCoord", "aTexCoord")
    }
    setVAO(vao){
        this.gl.bindVertexArray(vao)
    }

    createDefaultMatrices(){
        this.shaderWriter.addVertexUniform(Types.mat4, "uMatrixModel")
        this.shaderWriter.addVertexUniform(Types.mat4, "uMatrixView")
        this.shaderWriter.addVertexUniform(Types.nat4, "uMatrixProjection")

        this.shaderWriter.addVertexPrePositionContent("vec4 modelPosition = uMatrixModel * aPosition")
        this.shaderWriter.addVertexPrePositionContent("vec3 modelNormal   = mat3(uMatrixModel) * aNormal")

        this.shaderWriter.setVertexGlPosition("uMatrixProjection * uMatrixView * modelPosition")
        this.shaderWriter.addVertexOut(Types.vec3, "vNormal",       "mat3(transpose(inverse(uMatrixView))) * modelNormal")
        this.shaderWriter.addVertexOut(Types.vec3, "vSurfaceToCam", "(uMatrixView * -modelPosition).xyz")
    }
    setDefaultMatrices(model, view, projection){
        this.setMatrix4("uMatrixModel",      model)
        this.setMatrix4("uMatrixView",       view)
        this.setMatrix4("uMatrixProjection", projection)
    }

    createTexture(){

    }
    useTexture(){

    }

    createAmbientLight(){
        
    }
    setAmbientLight(){

    }

    createDirectionalLight(){
        this.shaderWriter.addVertexUniform(Types.vec3, "uLightDirDir")
        this.shaderWriter.addVertexOut(Types.vec3, "v_view_surfaceToDirLight", "mat3(uMatrixView) * (-uLightDirDir)")
    }
    setDirectionalLight(lightDirDir){
        this.setVec3("uLightDirDir", lightDirDir)
    }

    createPointLight(){
        this.shaderWriter.addVertexUniform(Types.vec3, "uLightPointPosition")
        this.shaderWriter.addVertexOut(Types.vec3, "v_view_surfaceToPointLight", "mat3(uMatrixView) * (uLightPointPosition - modelPosition.xyz)")
        this.shaderWriter.addVertexOut(Types.vec3, "v_model_pointLightToSurface", "modelPosition.xyz - uLightPointPosition")
    }
    setPointLight(lightPointPosition){
        this.setVec3("uLightPointPosition", lightPointPosition)
    }

    createConeLight(){
        this.shaderWriter.addVertexUniform(Types.vec3, "uLightConePosition")
        this.shaderWriter.addVertexUniform(Types.vec3, "uLightConeDir")
        this.shaderWriter.addVertexOut(Types.vec3, "v_view_surfaceToConeLight", "mat3(uMatrixView) * (uLightConePosition  - modelPosition.xyz)")
        this.shaderWriter.addVertexOut(Types.vec3, "v_view_coneLightDir", "mat3(uMatrixView) * uLightConeDirection")
    }
    setConeLight(lightConePosition, lightConeDir){
        this.setVec3("uLightConePosition", lightConePosition)
        this.setVec3("uLightConeDir", lightConeDir)
    }

    createDirectionalShadowMap(){
        this.shaderWriter.addVertexUniform(Types.mat4, "uMatrixDirShadowMap")
        this.shaderWriter.addVertexOut(Types.vec4, "vDirShadowMapCoord", "uMatrixDirShadowMap * modelPosition")
        this.shaderWriter.addFragmentUniform(Types.texture, "uDirShadowMap")
    }
    setDirectionalShadowMap(matrixDirShadowMap){
        this.setMatrix4("uMatrixDirShadowMap", matrixDirShadowMap)
    }

    createOmniShadowMap(){
        this.shaderWriter.addVertexUniform(Types.mat4, "uMatrixOmniShadowMap")
        this.shaderWriter.addVertexOut(Types.vec4, "vOmniShadowMapCoord", "uMatrixOmniShadowMap * modelPosition")
        this.shaderWriter.addFragmentUniform(Types.cubemap, "uOmniShadowMap")
    }
    setOmniShadowMap(matrixOmniShadowMap){
        this.setMatrix4("uMatrixOmniShadowMap", matrixOmniShadowMap)
    }

    createCubemap(){
        this.shaderWriter.addFragmentUniform(Types.cubemap, "uCubemap")
    }
    useCubemap(){

    }


    getVertex(){
        return this.shaderWriter.writeVertex()
    }

    getFragment(){
        return this.shaderWriter.writeFragment()
    }
}