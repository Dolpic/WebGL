export default class ShadersWriter{

    static Types = {
        vec4:    "vec4",
        vec3:    "vec3",
        vec2:    "vec2",
        mat4:    "mat4",
        float:   "float",
        texture: "sampler2D",
        cubemap: "samplerCube"
    }

    constructor(){
        this.vertex = {
            ins:           [],
            uniforms:      [],
            outs :         [],
            gl_Position :  [],
            pre_position:  [],
            post_position: []
        }

        this.fragment = {
            uniforms: [],
            content:  []
        }

        this.endl = ";\n"
    }

    addVertexPrePositionContent(expression){
        this.vertex.pre_position.push({content: expression})
    }

    setVertexGlPosition(expression){
        this.vertex.gl_Position = expression
    }

    addVertexAttribute(type, name){
        this.vertex.ins.push({type:type, name:name})
    }

    addVertexUniform(type, name){
        this.vertex.uniforms.push({type:type, name:name})
    }

    addVertexOut(type, name, expression){
        this.vertex.outs.push({type:type, name:name, expr:expression})
    }

    addFragmentUniform(type, name){
        this.fragment.uniforms.push({type:type, name:name})
    }

    addFragmentContent(content){
        this.fragment.content.push({content: content})
    }

    writeVertex(){
        return `#version 300 es
            ${this._createVariableList("in",      this.vertex.ins)}
            ${this._createVariableList("uniform", this.vertex.uniforms)}
            ${this._createVariableList("out",     this.vertex.outs)}
            void main() {
                ${this.vertex.pre_position.map(x => x+this.endl).reduce((acc,c) => acc+c)}
                gl_Position = ${this.vertex.gl_Position};
                ${this.vertex.post_position.map(x => x+this.endl).reduce((acc,c) => acc+c)}
                ${this.vertex.outs.map(x => x.name+" = "+x.expr+this.endl)}
            }
        `
    }

    writeFragment(){
        return `#version 300 es
            precision highp float;
            ${this._createVariableList("in lowp", this.vertex.outs)}
            ${this._createVariableList("uniform", this.fragment.uniforms)}
            out vec4 color;

            float cappedAngleWithNormal(vec3 vector) {
                return max(dot(normalize(vNormal), vector), 0.0);
            }

            void main() {

            }
        `
    }

    _createVariableList(type, list){
        return list.map(x => type+x.type+" "+x.name+this.endl).reduce( (acc,x)=>acc+x )
    }
}