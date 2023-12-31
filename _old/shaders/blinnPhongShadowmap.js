export default {
    vertex : `#version 300 es

    in vec4 aPosition;
    in vec4 aColor;
    in vec3 aNormal;
    in vec2 aTexCoord;

    uniform mat4 uMatrixShadowMap;
    uniform mat4 uMatrixOmniShadowMap;
    uniform vec3 uLightPointPosition;
    uniform vec3 uLightDirectionalDirection;
    uniform vec3 uLightConePosition;
    uniform vec3 uLightConeDirection;

    uniform mat4 uMatrixModel;
    uniform mat4 uMatrixView;
    uniform mat4 uMatrixProjection;

    out lowp vec4 vColor;
    out lowp vec2 vTextureCoord;

    out lowp vec3 vNormal;

    out lowp vec3 vSurfaceToLight;
    out lowp vec3 vSurfaceToCam;

    out lowp vec3 vSurfaceToConeLight;
    out lowp vec3 vSurfaceToDirLight;
    out lowp vec4 vShadowMapCoord;
    out lowp vec4 vOmniShadowMapCoord;
    out lowp vec3 vModelLightToPos;
    out lowp vec3 vLightConeDirection;

    void main() {
        vec4 modelPosition = uMatrixModel * aPosition;
        vec3 modelNormal   = mat3(uMatrixModel) * aNormal;

        gl_Position = uMatrixProjection * uMatrixView * modelPosition;

        vColor        = aColor;
        vTextureCoord = aTexCoord;

        vShadowMapCoord     = uMatrixShadowMap * modelPosition;
        vOmniShadowMapCoord = uMatrixOmniShadowMap * modelPosition;
        vModelLightToPos = modelPosition.xyz - uLightPointPosition;

        vNormal = mat3(transpose(inverse(uMatrixView))) * modelNormal;
        vSurfaceToCam       = (uMatrixView * -modelPosition).xyz;
        vSurfaceToLight     = mat3(uMatrixView) * (uLightPointPosition - modelPosition.xyz);
        vSurfaceToConeLight = mat3(uMatrixView) * (uLightConePosition  - modelPosition.xyz);
        vSurfaceToDirLight  = mat3(uMatrixView) * (-uLightDirectionalDirection);
        vLightConeDirection = mat3(uMatrixView) * uLightConeDirection;
    }`,

    
    fragment : `#version 300 es

    precision highp float;

    in lowp vec4 vColor;
    in lowp vec2 vTextureCoord;

    in lowp vec3 vNormal;
    in lowp vec3 vSurfaceToLight;
    in lowp vec3 vSurfaceToCam;

    in lowp vec3 vSurfaceToConeLight;
    in lowp vec3 vSurfaceToDirLight;
    in lowp vec3 vLightConeDirection;

    in lowp vec4 vShadowMapCoord;
    in lowp vec4 vOmniShadowMapCoord;
    in lowp vec3 vModelLightToPos;

    uniform mat4 uMatrixView;

    uniform sampler2D uTexture;
    uniform sampler2D uShadowMap;
    uniform samplerCube uCubemap;
    uniform samplerCube uOmniShadowMap;

    uniform vec3 uLightAmbientColor;
    uniform vec3 uLightDirectionalColor;
    uniform vec3 uLightPointColor;
    uniform vec3 uLightConeColor;

    uniform float specularPower;
    uniform vec3  specularColor;

    uniform float reflectionFactor;

    out vec4 color;

    const float shadow_bias = -0.003;
    const float coneLighEffectSmoothLow  = 0.48;
    const float coneLighEffectSmoothHigh = 0.55;
    const float shadowReduce = 0.3;

    float cappedAngleWithNormal(vec3 vector) {
        return max(dot(normalize(vNormal), vector), 0.0);
    }

    void main() {
        vec3 vnSurfaceToLight     = normalize(vSurfaceToLight);
        vec3 vnSurfaceToDirLight  = normalize(vSurfaceToDirLight);
        vec3 vnSurfaceToConeLight = normalize(vSurfaceToConeLight);
        vec3 vnSurfaceToCam       = normalize(vSurfaceToCam);
        vec3 vnLightConeDirection = normalize(vLightConeDirection);

        float coneLightEffect = smoothstep(coneLighEffectSmoothLow, coneLighEffectSmoothHigh, dot(vnSurfaceToConeLight, vnLightConeDirection));

        vec3 pointLight       = uLightPointColor       * cappedAngleWithNormal(vnSurfaceToLight);
        vec3 directionalLight = uLightDirectionalColor * cappedAngleWithNormal(vnSurfaceToDirLight);
        vec3 coneLight        = uLightConeColor        * cappedAngleWithNormal(vnSurfaceToConeLight) * coneLightEffect;

        vec3 lightingFactor = uLightAmbientColor + directionalLight + pointLight + coneLight;
        color = vec4( (vColor.rgb + texture(uTexture, vTextureCoord).rgb) * lightingFactor, vColor.a);

        float specular = cappedAngleWithNormal(normalize(vnSurfaceToLight+vnSurfaceToCam));
        color.rgb += pow(specular, specularPower*100.0) * specularColor;

        // Shadowmap
        vec3 shadowMapCoord = vShadowMapCoord.xyz / vShadowMapCoord.w;
        bool isInShadow = texture(uShadowMap, shadowMapCoord.xy).r < shadowMapCoord.z + shadow_bias ;
        color = vec4(isInShadow ? color.rgb*shadowReduce : color.rgb, color.a);

        // OmniShadowMap
        // vec3(-vModelLightToPos.x, -vModelLightToPos.y, vModelLightToPos.z)
        vec3 omniShadowMapCoord = vOmniShadowMapCoord.xyz / vOmniShadowMapCoord.w;
        float maxCoord = max( abs(vModelLightToPos.x), max(abs(vModelLightToPos.y), abs(vModelLightToPos.z)));
        float far = 200.0;
        float near = 0.1;
        float magnitude = ((far+near)/(far-near)) + (1.0/maxCoord)*( (-2.0*far*near)/(far-near) );  //(maxCoord-0.1)/(200.0-0.1);
        isInShadow = texture(uOmniShadowMap, vModelLightToPos).r < magnitude + shadow_bias ;
        color = vec4(isInShadow ? color.rgb*shadowReduce : color.rgb, color.a);


        vec3 dir = normalize(vec4(reflect(  mat3(inverse(uMatrixView))*-vnSurfaceToCam  , normalize(  mat3(inverse(uMatrixView))*vNormal  )), 1.0)).xzy;
        color = (1.0-reflectionFactor)*color + reflectionFactor*texture(uCubemap, dir);

        //color *= vec4(magnitude,magnitude,magnitude,1.0);
        //color *= pow(texture(uOmniShadowMap, vModelLightToPos ).r, 50.0);

    }`
}

