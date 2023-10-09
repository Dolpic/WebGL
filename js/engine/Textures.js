import Framebuffer from "./Scene/Framebuffer.js"

export default class Textures{
    constructor(glContext, params){
        this.params = params
        this.gl = glContext
        this.texture_counter = 0

        this.cubemapFaces = [
          this.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
          this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
          this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
          this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
          this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
          this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ]
    }

    _textureNearestClamp(type){
      this.gl.texParameteri(type, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
      this.gl.texParameteri(type, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
      this.gl.texParameteri(type, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
      this.gl.texParameteri(type, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    }

    loadImage(src, callback){
        let img = new Image()
        img.src = src
        img.onload = () => callback(img)
    }

    _new(type=this.gl.TEXTURE_2D){
        const texture = this.gl.createTexture()
        const id = "TEXTURE"+this.texture_counter
        this.gl.activeTexture(this.gl[id])
        this.gl.bindTexture(type, texture)
        this.texture_counter++
        return {texture:texture, id:id, number:this.texture_counter-1, type:type}
    }

    create(image, with_mipmap=true, size=this.params.texture_size){
        const tex = this._new()
        if(image != null){
          this.loadImage(image, img => {
            this.gl.activeTexture(this.gl[tex.id])
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img)
            if(with_mipmap) this.gl.generateMipmap(this.gl.TEXTURE_2D)
          })
        }else{
          this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, size.width, size.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null)
          this._textureNearestClamp(this.gl.TEXTURE_2D)
        }
        return tex
    }

    createDepthTexture(size=this.params.texture_size){
        const tex = this._new(this.gl.TEXTURE_2D)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT32F, size.width, size.height, 0, this.gl.DEPTH_COMPONENT, this.gl.FLOAT, null)
        this._textureNearestClamp(this.gl.TEXTURE_2D)
        tex.framebuffer = new Framebuffer(this.gl, size, tex.texture, this.gl.DEPTH_ATTACHMENT)
        return tex
    }

    createEmptyCubemap(size=this.params.texture_size, type="color"){
      const tex = this._new(this.gl.TEXTURE_CUBE_MAP)
      tex.framebuffers = []
      this.cubemapFaces.forEach(face => {
        if(type == "color"){
          this.gl.texImage2D(face, 0, this.gl.RGBA, size.width, size.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null)
          tex.framebuffers.push(new Framebuffer(this.gl, size, tex.texture, this.gl.COLOR_ATTACHMENT0, face))
        }else if(type == "depth"){
          this.gl.texImage2D(face, 0, this.gl.DEPTH_COMPONENT32F, size.width, size.height, 0, this.gl.DEPTH_COMPONENT, this.gl.FLOAT, null)
          tex.framebuffers.push(new Framebuffer(this.gl, size, tex.texture, this.gl.DEPTH_ATTACHMENT, face))
        }else{
          console.error("Invalid cubemap type : "+type)
        }
      })
      this._textureNearestClamp(this.gl.TEXTURE_CUBE_MAP)
      return tex
    }

    createCubemap(folder){
        const tex = this._new(this.gl.TEXTURE_CUBE_MAP)
        let faces = [
          [this.cubemapFaces[0], "px.png"],
          [this.cubemapFaces[1], "nx.png"],
          [this.cubemapFaces[2], "py.png"],
          [this.cubemapFaces[3], "ny.png"],
          [this.cubemapFaces[4], "pz.png"],
          [this.cubemapFaces[5], "nz.png"]
        ]

        const tmpContent = new Uint8Array([0,0,0,0])
        this.cubemapFaces.forEach(face => {
          this.gl.texImage2D(face, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, tmpContent)
        })
        this._textureNearestClamp(this.gl.TEXTURE_CUBE_MAP)

        if(folder != "ressources/cubemaps/null"){
          let completed = 0
          let imgs = []
          faces.forEach( (face,i) => {
            this.loadImage(folder+"/"+face[1], img => {
              imgs[i] = img
              if(++completed==6){

                this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, tex.texture)
                imgs.forEach( (img,i) => {
                  this.gl.texImage2D(faces[i][0], 0, this.gl.RGBA, img.width, img.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img)
                })
                this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP)
                this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR)
              }
            })
          })
        }
        return tex
    }
}