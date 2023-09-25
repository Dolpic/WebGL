export let Types = {
    vec4:    "vec4",
    vec3:    "vec3",
    vec2:    "vec2",
    mat4:    "mat4",
    mat3:    "mat3",
    float:   "float",
    texture: "sampler2D",
    cubemap: "samplerCube"
}

export default class ShadersWriter{
    constructor(glContext, program){
        this.vertex = {
            ins:           {},
            uniforms:      {},
            outs :         {},
            pre_position:  [],
            gl_Position :  []
        }

        this.fragment = {
            uniforms:        {},
            content:         [],
            lighting_factor: [],
            color_modifiers: [],
            functions:       []
        }

        this.gl = glContext
        this.program = program
        this.endl = ";\n"
        this.endlTab = this.endl+"    "
    }

    setUniforms(params){
        this.gl.useProgram(this.program)
        let uniforms = {...this.vertex.uniforms, ...this.fragment.uniforms}
        for(const entry in params){
            if(uniforms[entry] === undefined){
                console.warn("Unknown parameter : "+entry)
                continue
            }
            if(params[entry] === undefined){
                continue
            }
            switch(uniforms[entry].type){
                case Types.vec3:
                    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, entry), params[entry])
                    continue
                case Types.float:
                    this.gl.uniform1f(this.gl.getUniformLocation(this.program, entry), params[entry])
                    continue
                case Types.mat4:
                    this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, entry), false, params[entry])
                    continue
                case Types.texture:
                case Types.cubemap:
                    this.gl.activeTexture(this.gl[params[entry].id])
                    this.gl.bindTexture(params[entry].type, params[entry].texture)
                    this.gl.uniform1i(this.gl.getUniformLocation(this.program, entry), params[entry].number)
                    continue
                default:
                    console.warn("Parameter of unknown type : "+uniforms[entry])
            }
        }
    }

    addVertexPrePositionContent(expression){
        this.vertex.pre_position.push(expression)
    }

    setVertexGlPosition(expression){
        this.vertex.gl_Position = expression
    }

    addVertexAttribute(type, name){
        this.vertex.ins[name] = {name:name, type:type}
    }

    addVertexUniform(type, name){
        this.vertex.uniforms[name] = {name:name, type:type}
    }

    addVertexOut(type, name, expression){
        this.vertex.outs[name] = {name:name, type:type, expr:expression}
    }

    addFragmentUniform(type, name){
        this.fragment.uniforms[name] = {name:name, type:type}
    }

    addFragmentContent(content){
        this.fragment.content.push(content)
    }

    addFragmentColorModifier(content){
        this.fragment.color_modifiers.push(content)
    }

    addFragmentLightingFactor(factor){
        this.fragment.lighting_factor.push(factor)
    }

    addFragmentFunction(content){
        this.fragment.functions.push(content)
    }

    writeVertex(){
        return `#version 300 es
            ${this._createVariableList("in",      this.vertex.ins)}
            ${this._createVariableList("uniform", this.vertex.uniforms)}
            ${this._createVariableList("out",     this.vertex.outs)}
            void main() {
                ${this.vertex.pre_position.join(this.endlTab)+ (this.vertex.pre_position.length!=0?this.endl:"")}
                gl_Position = ${this.vertex.gl_Position+this.endl}
                ${Object.values(this.vertex.outs).map(x => x.name+" = "+x.expr).join(this.endlTab)+this.endl}
            }
        `.replace(/            /g,"")
    }

    writeFragment(){
        let lighting_factor
        if(this.fragment.lighting_factor!=0){
            lighting_factor = `
                vec3 lightingFactor =${this.fragment.lighting_factor.join(" + ")+this.endl}
                color = vec4(1.0, 1.0, 1.0, 1.0) * vec4(lightingFactor, 1.0);
            `
        }else{
            lighting_factor = ""
        }
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
            ${this.fragment.functions.join("\r")}
            void main() {
                ${this.fragment.content.join(this.endlTab)+this.endl}
                ${lighting_factor}
                ${this.fragment.color_modifiers.join(this.endlTab)+this.endl}
            }
        `.replace(/            /g,"")
    }

    _createVariableList(type, list){
        let values = Object.values(list)
        if(values.length == 0){
            return ""
        }
        return values.map(x => type+" "+x.type+" "+x.name).join(this.endl)+this.endl
    }
}