import * as Utils from "./utils.js"

export default class Objects{
    constructor(glContext, textures, engine, onadd){
        this.gl = glContext
        this.list = {}
        this.defaultMaterial = engine.defaultMaterial
        this.textures = textures
        this.textureToCreate = []
        this.objsByReflectionLevel = {}
        this.onadd = onadd
    }

    add(obj, name, material, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        if(this.list[name] != undefined){
            console.warn(`Object "${name}" already exists`)
            return
        }

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
            material: {...this.defaultMaterial},
            count:converted.count, 
            vao: vao,
            modelMatrix: Utils.createMatrix(),
            cubemap: this.textures.createEmptyCubemap(),
            reflectionMap: undefined
        }
        this.setTransform(name, position, rotation, scale)
        this.updateMaterial(name, material)

        this.onadd(this.list[name])
    }

    getList(){
        return this.list
    }

    getListExcept(name){
        let copy = {...this.list}
        delete copy[name]
        return copy
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
    
    setTransform(name, position=null, rotation=null, scale=null){
        position=position==null?this.getPosition(name):position
        rotation=rotation==null?this.getRotation(name):rotation
        scale=scale==null?this.getScale(name):scale
        Utils.transformMatrix(this.list[name].modelMatrix, position, rotation, scale)
    }

    getPosition(name){
        return Utils.getTranslation(this.list[name].modelMatrix)
    }

    getTransform(name){
        return Utils.getTransform(this.list[name].modelMatrix)
    }

    updateMaterial(name, material){
        for(let entry in material){
            this.list[name].material[entry] = material[entry]
        }
        this.onadd(this.list[name])

        this.objsByReflectionLevel = []
        for(let current_name in this.list){
            let level = this.list[current_name].material.reflectionLevel
            let reflectionFactor = this.list[current_name].material.reflectionFactor
            if(level != undefined && level >= 1 && reflectionFactor > 0){
                for(let i=level; i>0; i--){
                    if(this.objsByReflectionLevel[i] == undefined){
                        this.objsByReflectionLevel[i] = []
                    }
                    this.objsByReflectionLevel[i].push(this.list[current_name])
                }
            }
        }
    }

    getMaterial(name){
        return this.list[name].material
    }

    getReflectionFramebuffers(name){
        return this.list[name].cubemap.framebuffers
    }

    getObjectWithReflectionLevel(level){
        return this.objsByReflectionLevel[level]
    }

    useReflectionMap(name, reflectionMap){
        this.list[name].reflectionMap = reflectionMap
    }
}