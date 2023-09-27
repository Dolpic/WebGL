export default {
    vertex : `#version 300 es

    in vec4 aVertexPosition;
    in vec4 aVertexColor;
    in vec3 aVertexNormal;
    in vec2 aTextureCoord;

    uniform mat4 uMatrixModel;
    uniform mat4 uMatrixView;
    uniform mat4 uMatrixProjection;

    uniform mat4 uMatrixShadowMap;
    uniform vec3 uLightPointPosition;
    uniform vec3 uLightDirectionalDirection;
    uniform vec3 uLightConePosition;
    uniform vec3 uLightConeDirection;

    out lowp vec4 vColor;
    out lowp vec2 vTextureCoord;

    out lowp vec3 vNormal;

    out lowp vec3 vSurfaceToLight;
    out lowp vec3 vSurfaceToCam;

    out lowp vec3 vSurfaceToConeLight;
    out lowp vec3 vSurfaceToDirLight;
    out lowp vec4 vShadowMapCoord;
    out lowp vec3 vLightConeDirection;

    void main() {
        vec4 modelPosition = uMatrixModel * aVertexPosition;
        gl_Position = uMatrixProjection * uMatrixView * modelPosition;

        vColor        = aVertexColor;
        vTextureCoord = aTextureCoord;

        vShadowMapCoord =  uMatrixShadowMap * modelPosition;
        vNormal = mat3(transpose(inverse(uMatrixView))) * aVertexNormal;
        vSurfaceToCam       = (uMatrixView * -aVertexPosition).xyz;
        vSurfaceToLight     = mat3(uMatrixView) * (uLightPointPosition - aVertexPosition.xyz);
        vSurfaceToConeLight = mat3(uMatrixView) * (uLightConePosition  - aVertexPosition.xyz);
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

    uniform sampler2D uTexture;
    uniform samplerCube uCubemap;

    uniform vec3 uLightAmbientColor;
    uniform vec3 uLightDirectionalColor;
    uniform vec3 uLightPointColor;
    uniform vec3 uLightConeColor;

    out vec4 color;

    const float coneLighEffectSmoothLow  = 0.48;
    const float coneLighEffectSmoothHigh = 0.55;
    const float specularPower = 50.0;
    const vec3 specularColor = vec3(1.0,0.0,0.0);

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
        color.rgb += pow(specular, specularPower) * specularColor;
    }`
}