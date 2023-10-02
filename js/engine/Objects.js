import * as Utils from "./utils.js"
import Framebuffer from "./Scene/Framebuffer.js"

export default class Objects{
    constructor(glContext, textures){
        this.gl = glContext
        this.list = {}
        this.textures = textures
        this.textureToCreate = []
        this.objsByReflectionLevel = {}
    }

    add(obj, name, material, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
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

        const reflectionMap = this.textures.createEmptyCubemap()

        this.list[name] = {
            name:name,
            material: {...material},
            count:converted.count, 
            vao: vao,
            modelMatrix: Utils.createMatrix(),
            reflectionFramebuffers:  [
                new Framebuffer(this.gl, 512, 512,reflectionMap.texture, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X),
                new Framebuffer(this.gl, 512, 512,reflectionMap.texture, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X),
                new Framebuffer(this.gl, 512, 512,reflectionMap.texture, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y),
                new Framebuffer(this.gl, 512, 512,reflectionMap.texture, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y),
                new Framebuffer(this.gl, 512, 512,reflectionMap.texture, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z),
                new Framebuffer(this.gl, 512, 512,reflectionMap.texture, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z),
            ],
            ownReflectionMap: reflectionMap,
            reflectionMap: undefined
        }
        this.setTransform(name, position, rotation, scale)
        if(material.reflectionLevel != undefined && material.reflectionLevel != 0){
            for(let i=material.reflectionLevel; i>0; i--){
                if(this.objsByReflectionLevel[i] == undefined){
                    this.objsByReflectionLevel[i] = []
                }
                this.objsByReflectionLevel[i].push(this.list[name])
            }
            
        }else{
            if(this.objsByReflectionLevel[0] == undefined){
                this.objsByReflectionLevel[0] = []
            }
            this.objsByReflectionLevel[0].push(this.list[name])
        }
        //console.log(this.objsByReflectionLevel)
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

    getPosition(name){
        return Utils.getTranslation(this.list[name].modelMatrix)
    }
    
    setTransform(name, position=null, rotation=null, scale=null){
        position=position==null?this.getPosition(name):position
        rotation=rotation==null?this.getRotation(name):rotation
        scale=scale==null?this.getScale(name):scale
        Utils.transformMatrix(this.list[name].modelMatrix, position, rotation, scale)
    }

    updateMaterial(name, properties){
        for(let entry in properties){
            this.list[name].material[entry] = properties[entry]
        }
        console.log(this.list)
    }

    getReflectionFramebuffers(name){
        return this.list[name].reflectionFramebuffers
    }

    getObjectWithReflectionLevel(level){
        return this.objsByReflectionLevel[level]
    }

    useReflectionMap(name, reflectionMap){
        this.list[name].reflectionMap = reflectionMap
    }
}