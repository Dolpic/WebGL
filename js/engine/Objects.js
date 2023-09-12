import * as Utils from "./utils.js"

export default class Objects{
    constructor(glContext){
        this.gl = glContext
        this.list = {}
        this.textureToCreate = []
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
            this.createBuffer(converted.texture_coord, 3, 2, true)
            this.textureToCreate.push(obj.texture)
        }
        this.list[name] = {
            name:name, 
            count:converted.count, 
            vao: vao,
            modelMatrix: Utils.createMatrix()
        }
        this.setTransform(name, position, rotation, scale)
    }

    createBuffer(data, location, nbComponents, normalize=false){
        const buffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW) // Note : change this if the shape changes dynamically
        this.gl.enableVertexAttribArray(location)
        this.gl.vertexAttribPointer(location, nbComponents, this.gl.FLOAT, normalize, 0, 0)
    }

    getTexturesToCreate(){
        const tmp =  this.textureToCreate
        this.textureToCreate = []
        return tmp
    }
    
    setTransform(name, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        Utils.transformMatrix(this.list[name].modelMatrix, position, rotation, scale)
    }
}