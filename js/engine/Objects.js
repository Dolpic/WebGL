import * as Utils from "./utils.js"

export default class Objects{
    constructor(engine){
        this.engine = engine
        this.gl = engine.getGlContext()
        this.list = {}
    }

    add(obj, name, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        // Note : is it possible to not repeat the points that are at the same place (ex : only 8 vertex for a cube) ?
        const converted = ModelHelper.modelToBuffers(obj)
        const vao = this.gl.createVertexArray()
        this.gl.bindVertexArray(vao)
        this.createBuffer(converted.positions, 0, 3)
        this.createBuffer(converted.colors   , 1, 4)
        this.createBuffer(converted.normals  , 2, 3)
        if(obj.texture != null){
            // TODO now only one texture can be registered
            this.createBuffer(converted.texture_coord, 3, 2, true)
            this.engine.createTexture(obj.texture, "uTexture")
        }
        this.list[name] = {name:name, count:converted.count, vao: vao}
        this.setTransform(name, position, rotation, scale)
    }

    createBuffer(data, location, nbComponents, normalize=false){
        const buffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW) // Note : change this if the shape changes dynamically
        this.gl.enableVertexAttribArray(location)
        this.gl.vertexAttribPointer(location, nbComponents, this.gl.FLOAT, normalize, 0, 0)
    }
    
    setTransform(name, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        this.list[name].modelMatrix = Utils.createTransformMatrix(position, rotation, scale)
    }
}