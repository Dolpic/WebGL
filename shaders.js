const Shaders = {
    vertex : `#version 300 es

    in vec4 aVertexPosition;
    in vec4 aVertexColor;
    in vec3 aVertexNormal;
    //in vec2 aTextureCoord;

    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;

    uniform mat4 uLightMatrix;

    uniform vec3 uLightPositionPoint;
    uniform vec3 uLightPositionCone;
    
    uniform vec3 uLightDirectionDirectional;

    out lowp vec3 vNormals;
    
    out lowp vec3 vAmbLightColor;

    out lowp vec3 vSurfaceToLight;
    out lowp vec3 vSurfaceToCam;

    out lowp vec3 vSurfaceToConeLight;
    out lowp vec3 vSurfaceToDirLight;
    
    out lowp vec4 vColor;
    out lowp vec4 vTextureCoord;

    void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;

        // Sent to Fragment Shader
        vColor        = aVertexColor;
        vTextureCoord =  uLightMatrix * uModelMatrix * aVertexPosition;//aTextureCoord;
        vNormals = mat3(transpose(inverse(uViewMatrix))) * aVertexNormal;
        
        vSurfaceToCam   = (uViewMatrix * aVertexPosition).xyz;

        vSurfaceToLight     = mat3(uViewMatrix) * (uLightPositionPoint - aVertexPosition.xyz);
        vSurfaceToConeLight = mat3(uViewMatrix) * (uLightPositionCone  - aVertexPosition.xyz);
        vSurfaceToDirLight  = mat3(uViewMatrix) * (-uLightDirectionDirectional);
    }`,

    
    fragment : `#version 300 es

    precision highp float;

    in lowp vec4 vColor;
    in lowp vec3 vNormals;
    in lowp vec3 vSurfaceToLight;
    in lowp vec3 vSurfaceToCam;

    in lowp vec3 vSurfaceToConeLight;
    in lowp vec3 vSurfaceToDirLight;

    in lowp vec4 vTextureCoord;

    uniform sampler2D uTexture;

    uniform vec3 uAmbientLightColor;
    uniform vec3 uDirectionalLightColor;
    uniform vec3 uPointLightColor;

    uniform vec3 uConeLightColor;
    uniform vec3 uConeLightDirection;

    out vec4 colors;

    void main() {
        vec3 projectedTexcoord = vTextureCoord.xyz / vTextureCoord.w;

        vec3 normal = normalize(vNormals);

        vec3 directionalLight = uDirectionalLightColor * max( dot( normal, normalize(vSurfaceToDirLight) ) , 0.0);
        
        vec3 pointLight       = uPointLightColor * max( dot( normal, normalize(vSurfaceToLight) ), 0.0) ;

        float isConeLight = smoothstep(0.48, 0.55, dot( normalize(vSurfaceToConeLight) , normalize(uConeLightDirection) ) );
        vec3 coneLight    = uConeLightColor * max( dot( normal, normalize(vSurfaceToConeLight) ), 0.0) * isConeLight;

        float specular = max( dot(normal, normalize(normalize(vSurfaceToLight)+normalize(vSurfaceToCam)) ), 0.0);

        vec3 lightingFactor = uAmbientLightColor + directionalLight + pointLight + coneLight;

        colors = vec4(vColor.rgb * lightingFactor, vColor.a) + texture(uTexture, vTextureCoord.xy);
        colors.rgb += pow(specular, 50.0) * vec3(1.0,0.0,0.0);

        colors = 0.0001*colors + vec4(texture(uTexture, projectedTexcoord.xy).rgb, 1.0);
    }`
}

const lightsBufferShaders = {
    vertex : `#version 300 es
    in vec4 aVertexPosition;
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;
    out float vDepth;
    out vec2 position;
    void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
        vDepth = -gl_Position.z;
        position = gl_Position.xy;
    }`,

    fragment : `#version 300 es
    precision highp float;
    in lowp float vDepth;
    in lowp vec2 position;
    out vec4 colors;
    void main() {
        colors = vec4(vDepth, pow(position.x,50.0), pow(position.y,50.0), 1.0);
    }`
}