import * as Utils from "./utils.js"
import "./gl-matrix.js"
import Lights  from "./Lights.js"
import Program from "./Program.js"
import Objects from "./Objects.js"
import Textures from "./Textures.js"
import Framebuffers from "./Framebuffers.js"
import Camera from "./Camera.js"

export default class RenderingEngine{
  constructor(canvas, shaders, shadowMapShaders, params={}){
      if (! (this.gl = canvas.getContext("webgl2")) ){
        alert("WebGL2 is not supported on this browser")
      }
      this.canvasSize = {width:this.gl.canvas.clientWidth, height:this.gl.canvas.clientHeight}
      this.params = this.setDefaultParams(params)
      this.gl.clearColor(...this.params.clear_color) 
      this.gl.clearDepth(this.params.clear_depth)

      this.params.depth_test ? this.gl.enable(this.gl.DEPTH_TEST) : this.gl.disable(this.gl.DEPTH_TEST)
      this.gl.depthFunc(this.params.depth_test_function)

      this.skybox = null

      this.matrices_names = {
        model:     "uMatrixModel",
        view:      "uMatrixView",
        projection:"uMatrixProjection",
        shadowMap: "uMatrixShadowMap"
      }

      this.framebuffers = new Framebuffers(this, shaders)
      this.mainProgram = this.framebuffers.list["main"].program
      this.camera      = this.framebuffers.list["main"].camera
      this.objects     = new Objects(this)
      this.lights      = new Lights(this, this.mainProgram)
      this.textures    = new Textures(this, this.mainProgram)
      
      this.depthTexture = this.textures.createDepthTexture("uShadowMap", this.params.shadow_map_size)
      this.framebuffers.new("shadowMap", this.params.shadow_map_size, this.params.shadow_map_size, shadowMapShaders, this.depthTexture)
      this.shadowMapFramebuffer = this.framebuffers.list["shadowMap"]
  }

  setDefaultParams(params){
    let result = {}
    let defaults = {
        "depth_test": true,
        "depth_test_function": WebGL2RenderingContext.LEQUAL,
        "clear_color": [0.0, 0.0, 0.0, 1.0],
        "clear_depth": 1.0,
        "show_shadow_map" : false,
        "shadow_map_size" : 512
    }
    for(const prop in defaults){
        result[prop] = params.hasOwnProperty(prop) ? params[prop] : defaults[prop]
    }
    return result
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

  setCubemap(folder){
    this.textures.createCubemap(folder, this.mainProgram)
  }

  renderShadowMap(framebuffer){    
    this.shadowMapFramebuffer.camera.setCamera(this.lights.conePosition, this.lights.coneDirection)
    this.shadowMapFramebuffer.camera.setOrthoProjection(-10, 10, -10, 10, 0.1, 200)
    this.framebuffers.clearAndDraw(framebuffer, this.getObjects())
    const lightMatrix = Utils.createTransformMatrix([0.5,0.5,0.5], [0,0,0], [0.5,0.5,0.5])
    const camMatrices = this.shadowMapFramebuffer.camera.getMatrices()
    glMatrix.mat4.multiply(lightMatrix, lightMatrix, camMatrices.projection)
    glMatrix.mat4.multiply(lightMatrix, lightMatrix, camMatrices.view)
    return lightMatrix
  }

  setSkybox(shaders, folder){
    this.skyboxProgram = new Program(this, shaders)
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
    const lightMatrix = this.renderShadowMap(this.params.show_shadow_map?"main":"shadowMap")
   
    if(!this.params.show_shadow_map){
      this.mainProgram.setMatrix4(this.matrices_names.shadowMap, lightMatrix)
      this.framebuffers.clearAndDraw("main", this.getObjects())

      if(this.skybox != null){
        let viewProjection = glMatrix.mat4.create()
        glMatrix.mat4.multiply(viewProjection, this.camera.projection, this.camera.view)
        this.skyboxProgram.setMatrix4("uViewProjection", viewProjection)
        this.gl.bindVertexArray(this.skybox)
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
      }

    }
  }
}