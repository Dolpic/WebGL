export default class Textures{
    constructor(glContext){
        this.gl = glContext
        this.texture_counter = 0
    }

    loadImage(src, callback){
        let img = new Image()
        img.src = src
        img.onload = () => callback(img)
    }

    _new(location, program, type=this.gl.TEXTURE_2D){
        const texture = this.gl.createTexture()
        const id = "TEXTURE"+this.texture_counter
        this.gl.activeTexture(this.gl[id])
        this.gl.bindTexture(type, texture)
        program.setTextureUnit(location, this.texture_counter)
        this.texture_counter++
        return {texture:texture, id:id}
    }

    create(image, location_name, program, with_mipmap=true){
        const tex = this._new(location_name, program)
        this.loadImage(image, img => {
            this.gl.activeTexture(this.gl[tex.id])
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img)
            if(with_mipmap) this.gl.generateMipmap(this.gl.TEXTURE_2D)
        })
        return tex.texture
    }

    createDepthTexture(location_name, program, size){
        const tex = this._new(location_name, program)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT32F, size.width, size.height, 0, this.gl.DEPTH_COMPONENT, this.gl.FLOAT, null)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        return tex.texture
    }

    createCubemap(folder, program, size=512){
        const tex = this._new("uCubemap", program, this.gl.TEXTURE_CUBE_MAP)
        let faces = [
          [this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, "px.png"],
          [this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, "nx.png"],
          [this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, "py.png"],
          [this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, "ny.png"],
          [this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, "pz.png"],
          [this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, "nz.png"]
        ]
        let completed = 0
        if(folder != "ressources/cubemaps/null"){
          faces.forEach(face => {
            this.loadImage(folder+"/"+face[1], img => {
              this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, tex.texture)
              this.gl.texImage2D(face[0], 0, this.gl.RGBA, size, size, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img)
              if(++completed==6){
                this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP)
                this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR)
              }
            })
          })
        }
       
    }
}