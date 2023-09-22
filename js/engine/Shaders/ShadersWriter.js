export let Types = {
    vec4:    "vec4",
    vec3:    "vec3",
    vec2:    "vec2",
    mat4:    "mat4",
    float:   "float",
    texture: "sampler2D",
    cubemap: "samplerCube"
}

export default class ShadersWriter{
    constructor(glContext, program){
        this.vertex = {
            ins:           {},
            uniforms:      [],
            outs :         [],
            pre_position:  [],
            gl_Position :  []
        }

        this.fragment = {
            uniforms:        [],
            content:         [],
            color_base:      [],
            color_modifiers: []
        }

        this.gl = glContext
        this.program = program
        this.endl = ";\n"
    }

    setParams(params){
        this.gl.useProgram(this.program)
        for(entry in params){
            switch(this.vertex.ins[entry]){
                case "vec3":
                    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, entry), params[entry])
                    break
                case "float":
                    this.gl.uniform1f(this.gl.getUniformLocation(this.program, entry), params[entry])
                    break
                case "mat4":
                    this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, entry), false, params[entry])
                    break
                default:
                    console.log("Parameter of unknown type : "+this.vertex.ins[entry])
            }
        }
    }

    setTextureUnit(name, value){
        this.gl.useProgram(this.program)
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), value)
    }

    addVertexPrePositionContent(expression){
        this.vertex.pre_position.push(expression)
    }

    setVertexGlPosition(expression){
        this.vertex.gl_Position = expression
    }

    addVertexAttribute(type, name){
        this.vertex.ins[name] = type
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
        this.fragment.content.push(content)
    }

    addFragmentColorBase(content){
        this.fragment.color_base.push(content)
    }

    addFragmentColorModifier(content){
        this.fragment.color_modifiers.push(content)
    }

    writeVertex(){
        return `#version 300 es
            ${Object.entries(this.vertex.ins).map(x => "in "+x[1]+" "+x[0]).join(this.endl)+this.endl}
            ${this._createVariableList("uniform", this.vertex.uniforms)}
            ${this._createVariableList("out",     this.vertex.outs)}
            void main() {
                ${this.vertex.pre_position.join(this.endl+"    ")+this.endl}
                gl_Position = ${this.vertex.gl_Position+this.endl}
                ${this.vertex.outs.map(x => x.name+" = "+x.expr).join(this.endl+"    ")}
            }
        `.replace(/            /g,"")
    }

    writeFragment(){
        return `#version 300 es
            precision highp float;
            ${this._createVariableList("in lowp", this.vertex.outs)}
            ${this._createVariableList("uniform", this.fragment.uniforms)}
            out vec4 color;

            const float shadow_bias = -0.003;
            const float coneLighEffectSmoothLow  = 0.48;
            const float coneLighEffectSmoothHigh = 0.55;
            const float shadowReduce = 0.3;
            const float far_plane = 200.0;
            const float near_plane = 0.1;

            float cappedAngleWithNormal(vec3 vector) {
                return max(dot(normalize(vNormal), vector), 0.0);
            }

            void main() {
                ${this.fragment.content.join(this.endl+"    ")}
                vec3 lightingFactor = uLightAmbientColor + directionalLight + pointLight + coneLight;
                color = vec4( (vColor.rgb + texture(uTexture, vTextureCoord).rgb) * lightingFactor, vColor.a);
                ${this.fragment.color_modifiers.join(this.endl+"    ")}
            }
        `.replace(/            /g,"")
    }

    _createVariableList(type, list){
        return list.map(x => type+" "+x.type+" "+x.name).join(this.endl)+this.endl
    }
}