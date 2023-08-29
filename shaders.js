const Shaders = {
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

        // Sent to Fragment Shader
        vColor        = aVertexColor;
        vTextureCoord = aTextureCoord;

        vShadowMapCoord =  uMatrixShadowMap * modelPosition;
        vNormal = mat3(transpose(inverse(uMatrixView))) * aVertexNormal;
        vSurfaceToCam       = (uMatrixView * aVertexPosition).xyz;
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
    uniform sampler2D uShadowMap;

    uniform vec3 uLightAmbientColor;
    uniform vec3 uLightDirectionalColor;
    uniform vec3 uLightPointColor;
    uniform vec3 uLightConeColor;

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
        //colors.rgb += pow(specular, 50.0) * vec3(1.0,0.0,0.0);


        //colors = (-projectedTexcoord.z > 1.0 || -projectedTexcoord.z < 0.0) ? vec4(0.0,1.0,0.0,1.0) : colors;
        //colors = (texture(uTexture, projectedTexcoord.xy).r > 1.0 || texture(uTexture, projectedTexcoord.xy).r < 0.0) ? vec4(0.0,0.0,1.0,1.0) : colors;

        vec3 shadowMapCoord = vShadowMapCoord.xyz / vShadowMapCoord.w;
        bool isInShadow = texture(uShadowMap, shadowMapCoord.xy).r < shadowMapCoord.z + shadow_bias ;
        color = vec4(isInShadow ? color.rgb*shadowReduce : color.rgb, color.a);

        //colors = vec4( texture(uTexture, projectedTexcoord.xy).rrr , 1.0);
        //float grey = projectedTexcoord.z;
        //colors = vec4( grey,grey,grey, 1.0);
    }`
}

const lightsBufferShaders = {
    vertex : `#version 300 es
    in vec4 aVertexPosition;
    uniform mat4 uMatrixModel;
    uniform mat4 uMatrixView;
    uniform mat4 uMatrixProjection;
    out float vDepth;
    out vec2 position;
    void main() {
        gl_Position = uMatrixProjection * uMatrixView * uMatrixModel * aVertexPosition;
        vDepth = (gl_Position.z+1.0)/2.0;
    }`,
    fragment : `#version 300 es
    precision highp float;
    in lowp float vDepth;
    out vec4 colors;
    void main() {
        colors = vec4(vDepth, vDepth, vDepth, 1.0);
    }`
}