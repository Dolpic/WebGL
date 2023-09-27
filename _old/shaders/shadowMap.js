export default {
    vertex : `#version 300 es
    in vec4 aPosition;
    uniform mat4 uMatrixModel;
    uniform mat4 uMatrixView;
    uniform mat4 uMatrixProjection;
    out float vDepth;
    out vec2 position;
    void main() {
        gl_Position = uMatrixProjection * uMatrixView * uMatrixModel * aPosition;
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