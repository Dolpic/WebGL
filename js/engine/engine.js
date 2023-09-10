import * as Utils from "./utils.js"
import "./gl-matrix.js"
import Program from "./Program.js"
import Objects from "./Objects.js"
import Textures from "./Textures.js"
import Scene from "./Scene/Scene.js"

export default class RenderingEngine{
  constructor(canvas, shaders, shadowMapShaders, params={}){
      if (! (this.gl = canvas.getContext("webgl2")) ){
        alert("WebGL2 is not supported on this browser")
      }

      this.params = this.setDefaultParams(params)
      this.gl.clearColor(...this.params.clear_color) 
      this.gl.clearDepth(this.params.clear_depth)

      this.params.depth_test ? this.gl.enable(this.gl.DEPTH_TEST) : this.gl.disable(this.gl.DEPTH_TEST)
      this.gl.depthFunc(this.params.depth_test_function)

      this.mainScene = new Scene(this, shaders)
      this.mainProgram = this.mainScene.program

      this.objects  = new Objects(this)
      this.textures = new Textures(this.getGlContext())
      this.depthTexture = this.textures.createDepthTexture("uShadowMap", this.mainProgram, this.params.shadow_map_size)

      this.shadowMapScene = new Scene(this, shadowMapShaders)
      this.shadowMapScene.setFramebuffer(this.params.shadow_map_size, this.depthTexture)

      this.skybox = null
  }

  setDefaultParams(params){
    let result = {}
    let defaults = {
        "depth_test": true,
        "depth_test_function": WebGL2RenderingContext.LEQUAL,
        "clear_color": [0.0, 0.0, 0.0, 1.0],
        "clear_depth": 1.0,
        "show_shadow_map" : false,
        "shadow_map_size" : {width:512, height:512}
    }
    for(const prop in defaults){
        result[prop] = params.hasOwnProperty(prop) ? params[prop] : defaults[prop]
    }
    return result
  }

  getScreen(){
    return {
      size : {width:this.gl.canvas.clientWidth, height:this.gl.canvas.clientHeight},
      ratio : this.gl.canvas.clientWidth/this.gl.canvas.clientHeight
    }
  }

  getGlContext(){
    return this.gl
  }

  setObjectTransform(name, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
    this.objects.setTransform(name, position, rotation, scale)
  }

  addObject(obj, name, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
    this.objects.add(obj, name, position, rotation, scale)
  }

  getObjects(){
    return this.objects.list
  }

  getViewProjection(){
    return this.mainScene.camera.getMatrices()
  }

  setViewProjection(view, projection=null){
    this.mainScene.camera.setMatrixView(view)
    if(projection != null) this.mainScene.camera.setMatrixProjection(projection)
  }

  setCubemap(folder){
    this.textures.createCubemap(folder, this.mainProgram)
  }

  createTexture(image, location_name, with_mipmap=true){
    return this.textures.create(image, location_name, this.mainProgram, with_mipmap)
  }

  renderShadowMap(framebuffer){    
    this.shadowMapScene.camera.setCamera(this.mainScene.lights.conePosition, this.mainScene.lights.coneDirection)
    this.shadowMapScene.camera.setOrthoProjection(-10, 10, -10, 10, 0.1, 200)
    this.shadowMapScene.render(this.getObjects())
    const lightMatrix = Utils.createTransformMatrix([0.5,0.5,0.5], [0,0,0], [0.5,0.5,0.5])
    const camMatrices = this.shadowMapScene.camera.getMatrices()
    glMatrix.mat4.multiply(lightMatrix, lightMatrix, camMatrices.projection)
    glMatrix.mat4.multiply(lightMatrix, lightMatrix, camMatrices.view)
    this.mainScene.program.setMatrix4(Utils.names.mat.shadowMap, lightMatrix)
  }

  setSkybox(shaders, folder){
    this.skyboxProgram = new Program(this.getGlContext(), shaders)
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)
    const buffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,1,1, 1,1,1, -1,-1,1, 1,1,1, 1,-1,1, -1,-1,1]), this.gl.STATIC_DRAW)
    const location = this.gl.getAttribLocation(this.skyboxProgram.program, "aPosition")
    this.gl.enableVertexAttribArray(location)
    this.gl.vertexAttribPointer(location, 3, this.gl.FLOAT, false, 0, 0)

    this.skybox = vao
    this.textures.createCubemap(folder, this.skyboxProgram)
  }

  render() {
    this.renderShadowMap(this.params.show_shadow_map?"main":"shadowMap")
   
    if(!this.params.show_shadow_map){
      this.mainScene.render(this.getObjects())

      if(this.skybox != null){
        let viewProjection = glMatrix.mat4.create()
        glMatrix.mat4.multiply(viewProjection, this.mainScene.camera.projection, this.mainScene.camera.view)
        this.skyboxProgram.setMatrix4("uViewProjection", viewProjection)
        this.gl.bindVertexArray(this.skybox)
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
      }

    }
  }
}