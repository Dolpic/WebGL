import ShadersWriter, {Types} from "./ShadersWriter.js"

export default class Shaders{
    constructor(){
        this.shaderWriter = new ShadersWriter
        this.to_apply = []
    }

    createDefaultAttributes(){
        this.shaderWriter.addVertexAttribute(Types.vec4, "aPosition")
        this.shaderWriter.addVertexAttribute(Types.vec4, "aColor")
        this.shaderWriter.addVertexAttribute(Types.vec3, "aNormal")
        this.shaderWriter.addVertexAttribute(Types.vec2, "aTexCoord")
        this.shaderWriter.addVertexOut(Types.vec4, "vColor", "aColor")
        this.shaderWriter.addVertexOut(Types.vec2, "vTextureCoord", "aTexCoord")
    }
    setDefaultAttributes(){

    }

    createDefaultMatrices(){
        this.shaderWriter.addVertexUniform(Types.mat4, "uMatrixModel")
        this.shaderWriter.addVertexUniform(Types.mat4, "uMatrixView")
        this.shaderWriter.addVertexUniform(Types.nat4, "uMatrixProjection")
        this.shaderWriter.setVertexGlPosition("uMatrixProjection * uMatrixView * modelPosition")
        this.shaderWriter.addVertexOut(Types.vec3, "vNormal", "mat3(transpose(inverse(uMatrixView))) * mat3(uMatrixModel) * aNormal")
    }
    setDefaultMatrices(){

    }

    createAmbientLight(){
        
    }
    setAmbientLight(){

    }

    createDirectionalLight(){
        this.shaderWriter.addVertexUniform(Types.vec3, "uLightDirDir")
    }
    setDirectionalLight(){

    }

    createPointLight(){
        this.shaderWriter.addVertexUniform(Types.vec3, "uLightPointPosition")
    }
    setPointLight(){

    }

    createConeLight(){
        this.shaderWriter.addVertexUniform(Types.vec3, "uLightConePosition")
        this.shaderWriter.addVertexUniform(Types.vec3, "uLightConeDir")
    }
    setConeLight(){

    }

    createDirectionalShadowMap(){
        this.shaderWriter.addVertexUniform(Types.mat4, "uMatrixDirShadowMap")
    }
    setDirectionalShadowMap(){

    }

    createOmniShadowMap(){
        this.shaderWriter.addVertexUniform(Types.mat4, "uMatrixOmniShadowMap")
    }
    setOmniShadowMap(){

    }



    getVertex(){
        return this.shaderWriter.writeVertex()
    }

    getFragment(){
        return this.shaderWriter.writeFragment()
    }
}