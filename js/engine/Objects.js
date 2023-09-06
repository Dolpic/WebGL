import * as Utils from "./utils.js"
import "./gl-matrix.js"

export default class Objects{
    constructor(engine){
        this.engine = engine
        this.gl = engine.gl
        this.list = {}
    }

    add(obj, name, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        // Note : is it possible to not repeat the points that are at the same place (ex : only 8 vertex for a cube) ?
        const converted = ModelHelper.modelToBuffers(obj)
        const vao = this.gl.createVertexArray()
        this.gl.bindVertexArray(vao)
        this.engine.createBuffer(converted.positions, "aVertexPosition", 3)
        this.engine.createBuffer(converted.colors,    "aVertexColor",    4)
        this.engine.createBuffer(converted.normals,   "aVertexNormal",   3)
        if(obj.texture != null){
          this.engine.createBuffer(converted.texture_coord, "aTextureCoord", 2, true)
          this.engine.textures.create(obj.texture, "uTexture")
        }

        this.list[name] = {
            name:name.replace(" ","_"), 
            vao:vao, 
            count:converted.count
        }
        this.setTransform(name, position, rotation, scale)
    }
    
    setTransform(name, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        this.list[name].modelMatrix = Utils.createTransformMatrix(position, rotation, scale)
    }

    draw(program){
        Object.values(this.list).forEach(obj => {
          this.gl.bindVertexArray(obj.vao)
          program.setMatrix4(this.engine.matrices_names.model, obj.modelMatrix)
          this.gl.drawArrays(this.gl.TRIANGLES, 0, obj.count)
        })
    }
}