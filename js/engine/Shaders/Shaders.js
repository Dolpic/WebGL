import ShadersWriter, {Types} from "./ShadersWriter.js"

export default class Shaders{
    constructor(glContext, program){
        this.gl = glContext
        this.sw = new ShadersWriter(glContext, program)
    }

    createVAO(){
        this.sw.addVertexAttribute(Types.vec4, "iPosition")
        this.sw.addVertexAttribute(Types.vec4, "iColor")
        this.sw.addVertexAttribute(Types.vec3, "iNormal")
        this.sw.addVertexAttribute(Types.vec2, "iTexCoord")
        this.sw.addVertexOut(Types.vec4, "vColor", "iColor")
        this.sw.addVertexOut(Types.vec2, "vTextureCoord", "iTexCoord")
        this.sw.addFragmentColorModifier("color *= vColor")
        return {position:"iPosition", color:"iColor", normal:"iNormal", texCoord: "iTexCoord"}
    }

    createDefaultMatrices(iPosition, iNormal){
        this.sw.addVertexUniform(Types.mat4, "uMatModel")
        this.sw.addVertexUniform(Types.mat4, "uMatView")
        this.sw.addVertexUniform(Types.mat4, "uMatProjection")

        this.sw.addVertexPrePositionContent(`vec4 modelPosition = uMatModel * ${iPosition}`)
        this.sw.addVertexPrePositionContent(`vec3 modelNormal   = mat3(uMatModel) * ${iNormal}`)
        this.sw.addVertexPrePositionContent(`mat3 uMatView3     = mat3(uMatView)`)

        this.sw.setVertexGlPosition("uMatProjection * uMatView * modelPosition")
        this.sw.addVertexOut(Types.vec3, "vNormal", "mat3(transpose(inverse(uMatView))) * modelNormal")
        this.sw.addVertexOut(Types.vec3, "v_view_SurfaceToCam", "normalize((uMatView * -modelPosition).xyz)")
        this.sw.addFragmentFunction(`
            float cappedAngleWithNormal(vec3 vector) {
                return max(dot(normalize(vNormal), vector), 0.0);
            }
        `)
        return {
            model:"uMatModel", 
            view:"uMatView", 
            view3:"uMatView3",
            projection:"uMatProjection", 
            modelNormal:"modelNormal", 
            modelPosition:"modelPosition",
            vNormal: "vNormal",
            surfaceToCam: "v_view_SurfaceToCam"
        }
    }

    createTexture(){
        this.sw.addFragmentUniform(Types.texture, "uTexture")
        this.sw.addFragmentColorModifier("color += texture(uTexture, vTextureCoord)")
    }

    createReflection(matView, vNormal, surfaceToCam){
        this.sw.addFragmentUniform(Types.cubemap, "uReflectionCubemap")
        this.sw.addFragmentUniform(Types.float, "uReflectionFactor")
        this.sw.addVertexOut(Types.mat3, "uViewInverse3", `mat3(inverse(${matView}))`)
        this.sw.addFragmentContent(`vec3 reflectionDir = normalize(vec4(reflect(  uViewInverse3*-${surfaceToCam}, normalize(uViewInverse3*${vNormal}) ), 1.0)).xzy`)
        this.sw.addFragmentColorModifier(`color = (1.0-uReflectionFactor)*color + uReflectionFactor*texture(uReflectionCubemap, reflectionDir)`)
    }

    createAmbientLight(){
        this.sw.addFragmentUniform(Types.vec3, "uLightAmbientColor")
        this.sw.addFragmentLightingFactor("uLightAmbientColor")
    }

    createDirectionalLight(matView3){
        this.sw.addVertexUniform(Types.vec3, "uLightDirDir")
        this.sw.addVertexOut(Types.vec3, "v_view_surfaceToDirLight", `normalize(${matView3} * (-uLightDirDir))`)
        this.sw.addFragmentUniform(Types.vec3, "uLightDirColor")
        this.sw.addFragmentContent(`vec3 directionalLight = uLightDirColor * cappedAngleWithNormal(v_view_surfaceToDirLight)`)
        this.sw.addFragmentLightingFactor("directionalLight")
    }

    createPointLight(matView3, modelPosition, withSpecular=false, surfaceToCam=null){
        this.sw.addVertexUniform(Types.vec3, "uLightPointPosition")
        this.sw.addVertexOut(Types.vec3, "v_view_surfaceToPointLight", `normalize(${matView3} * (uLightPointPosition - ${modelPosition}.xyz))`)
        this.sw.addVertexOut(Types.vec3, "v_model_pointLightToSurface", `${modelPosition}.xyz - uLightPointPosition`)
        this.sw.addFragmentUniform(Types.vec3, "uLightPointColor")
        this.sw.addFragmentContent(`vec3 pointLight = uLightPointColor * cappedAngleWithNormal(v_view_surfaceToPointLight)`)
        this.sw.addFragmentLightingFactor("pointLight")
        if(withSpecular){
            this.sw.addFragmentUniform(Types.float, "uLightPointSpecularPower")
            this.sw.addFragmentUniform(Types.vec3, "uLightPointSpecularColor")
            this.sw.addFragmentContent(`float specular = cappedAngleWithNormal(normalize(v_view_surfaceToPointLight+${surfaceToCam}))`)
            this.sw.addFragmentColorModifier("color.rgb += pow(specular, uLightPointSpecularPower*100.0) * uLightPointSpecularColor")
        }
        return {model_lightToSurface:"v_model_pointLightToSurface"}
    }

    createConeLight(matView3){
        this.sw.addVertexUniform(Types.vec3, "uLightConePosition")
        this.sw.addVertexUniform(Types.vec3, "uLightConeDir")
        this.sw.addVertexOut(Types.vec3, "vLightConeDir", "uLightConeDir")
        this.sw.addVertexOut(Types.vec3, "v_view_surfaceToConeLight", `normalize(${matView3} * (uLightConePosition  - modelPosition.xyz))`)
        this.sw.addVertexOut(Types.vec3, "v_view_coneLightDir", `normalize(${matView3} * uLightConeDir)`)
        this.sw.addFragmentUniform(Types.vec3, "uLightConeColor")
        this.sw.addFragmentContent(`float coneLightEffect = smoothstep(coneLighEffectSmoothLow, coneLighEffectSmoothHigh, dot(v_view_surfaceToConeLight, vLightConeDir))`)
        this.sw.addFragmentContent(`vec3 coneLight = uLightConeColor * cappedAngleWithNormal(v_view_surfaceToConeLight) * coneLightEffect`)
        this.sw.addFragmentLightingFactor("coneLight")
    }

    createDirectionalShadowMap(modelPosition){
        this.sw.addVertexUniform(Types.mat4, "uMatDirShadowMap")
        this.sw.addVertexOut(Types.vec4, "vDirShadowMapCoord", `uMatDirShadowMap * ${modelPosition}`)
        this.sw.addFragmentUniform(Types.texture, "uDirShadowMap")
        this.sw.addFragmentContent(`vec3 shadowMapCoord = vDirShadowMapCoord.xyz / vDirShadowMapCoord.w`)
        this.sw.addFragmentContent(`bool isInDirShadow = texture(uDirShadowMap, shadowMapCoord.xy).r < shadowMapCoord.z + shadow_bias`)
        this.sw.addFragmentColorModifier("color = vec4(isInDirShadow ? color.rgb*shadowReduce : color.rgb, color.a)")
    }

    createOmniShadowMap(modelPosition, model_lightToSurface){
        this.sw.addVertexUniform(Types.mat4, "uMatOmniShadowMap")
        this.sw.addVertexOut(Types.vec4, "vOmniShadowMapCoord", `uMatOmniShadowMap * ${modelPosition}`)
        this.sw.addFragmentUniform(Types.cubemap, "uOmniShadowMap")
        this.sw.addFragmentContent(`float maxCoord = max( abs(${model_lightToSurface}.x), max(abs(${model_lightToSurface}.y), abs(${model_lightToSurface}.z)))`)
        this.sw.addFragmentContent(`float magnitude = ((far_plane+near_plane)/(far_plane-near_plane)) + (1.0/maxCoord)*( (-2.0*far_plane*near_plane)/(far_plane-near_plane) )`)
        this.sw.addFragmentContent(`bool isInOmniShadow = texture(uOmniShadowMap, ${model_lightToSurface}).r < magnitude + shadow_bias`)
        this.sw.addFragmentColorModifier("color = vec4(isInOmniShadow ? color.rgb*shadowReduce : color.rgb, color.a)")
    }

    createSkyBox(){
        this.sw.addVertexAttribute(Types.vec4, "iPosition")
        this.sw.setVertexGlPosition("iPosition")
        this.sw.addVertexOut(Types.vec4, "position", "iPosition")
        this.sw.addFragmentUniform(Types.mat4, "uViewProjection")
        this.sw.addFragmentUniform(Types.mat4, "uMatModel")
        this.sw.addFragmentUniform(Types.cubemap, "uCubemap")
        this.sw.addFragmentContent("vec4 pos = inverse(uViewProjection)*position")
        this.sw.addFragmentColorModifier("color = texture(uCubemap, pos.xzy/pos.w)")
    }

    createShadowmap(){
        this.sw.addVertexAttribute(Types.vec4, "iPosition")
        this.sw.addVertexUniform(Types.mat4, "uMatModel")
        this.sw.addVertexUniform(Types.mat4, "uMatView")
        this.sw.addVertexUniform(Types.mat4, "uMatProjection")
        this.sw.setVertexGlPosition("uMatProjection * uMatView * uMatModel * iPosition")
        this.sw.addVertexOut(Types.float, "vDepth", "(gl_Position.z+1.0)/2.0")
        this.sw.addFragmentColorModifier("color = vec4(vDepth, vDepth, vDepth, 1.0)")
    }

    createDebugFullRed(){
        this.sw.addFragmentColorModifier("color = vec4(1.0, 0.0, 0.0, 1.0)")
    }

    setShaderParams(params){
        this.sw.setUniforms(params)
    }

    setVAO(vao){
        this.gl.bindVertexArray(vao)
    }

    getVertex(){
        return this.sw.writeVertex()
    }

    getFragment(){
        return this.sw.writeFragment()
    }
}