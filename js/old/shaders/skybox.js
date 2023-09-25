export default {
    vertex : `#version 300 es
    in vec4 aPosition;
    out vec4 position;
    void main() {
        gl_Position = aPosition;
        position = aPosition;
    }`,

    fragment : `#version 300 es
    precision highp float;
    in vec4 position;
    uniform mat4 uViewProjection;
    uniform samplerCube uCubemap;
    out vec4 color;
    void main() {
        vec4 pos = inverse(uViewProjection)*position;
        color = texture(uCubemap, pos.xzy/pos.w);
    }`
}