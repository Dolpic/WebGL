export default class Textures{
    constructor(engine, program){
        this.program = program
        this.gl = engine.gl
        this.texture_counter = 0
    }

    create(image, location_name, with_mipmap=true){
        const texture = this.gl.createTexture()
        const texture_id = "TEXTURE"+this.texture_counter
        this.gl.activeTexture(this.gl[texture_id])
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
        this.loadImage(image, img => this.bindImage(img, texture_id,  with_mipmap) )
        this.program.setTextureUnit(location_name, this.texture_counter)
        this.texture_counter++ // TODO : Should add a warning if no more texture can be created
        return texture
    }

    bindImage(image, texture_id, with_mipmap){
        this.gl.activeTexture(this.gl[texture_id])
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image)
        if(with_mipmap) this.gl.generateMipmap(this.gl.TEXTURE_2D)
    }

    createDepthTexture(location_name, size=512){
        const texture = this.gl.createTexture()
        const texture_id = "TEXTURE"+this.texture_counter
        this.gl.activeTexture(this.gl[texture_id])
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT32F, size, size, 0, this.gl.DEPTH_COMPONENT, this.gl.FLOAT, null)
        this.program.setTextureUnit(location_name, this.texture_counter)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        this.texture_counter++ // TODO : Should add a warning if no more texture can be created
        return texture
    }

    createCubemap(folder, program){
        let texture = this.gl.createTexture()
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture)
        this.gl.activeTexture(this.gl["TEXTURE"+this.texture_counter])
        let faces = [
          [this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, "px.png"],
          [this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, "nx.png"],
          [this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, "py.png"],
          [this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, "ny.png"],
          [this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, "pz.png"],
          [this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, "nz.png"]
        ]
        let completed = 0
        faces.forEach(face => {
          this.loadImage(folder+"/"+face[1], img => {
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture)
            this.gl.texImage2D(face[0], 0, this.gl.RGBA, 512, 512, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img)
            if(++completed==6){
              this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP)
              this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR)
            }
          })
        })
        program.setTextureUnit("uCubemap", this.texture_counter)
        this.texture_counter++ // TODO : Should add a warning if no more texture can be created
    }

    loadImage(src, callback){
        let img = new Image()
        img.src = src
        img.onload = () => callback(img)
    }
}