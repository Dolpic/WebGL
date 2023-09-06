import * as Utils from "./utils.js"
import "./gl-matrix.js"
import Lights  from "./Lights.js"
import Camera  from "./Camera.js"
import Program from "./Program.js"
import Objects from "./Objects.js"
import Textures from "./Textures.js"
import Framebuffer from "./Framebuffer.js"

export default class RenderingEngine{
  constructor(canvas, shaders, shadowMapShaders, params={}){
      if (! (this.gl = canvas.getContext("webgl2")) ){
        alert("WebGL2 is not supported on this browser")
      }
      this.canvasSize = {width:this.gl.canvas.clientWidth, height:this.gl.canvas.clientHeight}
      this.params = Utils.setDefaultParams(params)
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

      this.mainProgram      = new Program(this, shaders)
      this.objects          = new Objects(this)
      this.lights           = new Lights(this)
      this.camera           = new Camera(this)
      this.textures         = new Textures(this)
      this.framebuffer      = new Framebuffer(this, shadowMapShaders)

      this.createShadowmapFramebuffer()
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
   //this.textures.createCubemap(folder, this.mainProgram)
  }

  clear(){
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
  }

  renderShadowMap(framebuffer){    
    this.framebuffer.use(framebuffer)
    this.framebuffer.setCamera(this.lights.conePosition, this.lights.coneDirection)
    this.framebuffer.setOrthoProjection(-10, 10, -10, 10, 0.1, 200)

    this.clear()
    this.objects.draw(this.framebuffer.program)
    const lightMatrix = Utils.createTransformMatrix([0.5,0.5,0.5], [0,0,0], [0.5,0.5,0.5])
    const camMatrices = this.framebuffer.getCameraMatrices()
    glMatrix.mat4.multiply(lightMatrix, lightMatrix, camMatrices.projection)
    glMatrix.mat4.multiply(lightMatrix, lightMatrix, camMatrices.view)
    return lightMatrix
  }
  createShadowmapFramebuffer(){
    this.depthTexture = this.textures.createDepthTexture("uShadowMap", this.params.shadow_map_size)
    this.framebuffer.create("shadowMap", this.params.shadow_map_size, this.params.shadow_map_size, this.depthTexture)
  }

  createBuffer(data, location_name, nbComponents, normalize=false, program=this.mainProgram){
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer())
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW) // Note : change this if the shape changes dynamically
    const location = this.gl.getAttribLocation(program.program, location_name)
    this.gl.enableVertexAttribArray(location)
    this.gl.vertexAttribPointer(location, nbComponents, this.gl.FLOAT, normalize, 0, 0)
  }

  setSkybox(shaders, folder){
    /*this.skyboxProgram = new Program(this, shaders)
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)
    this.createBuffer([-1,1,1, 1,1,1, -1,-1,1, 1,1,1, 1,-1,1, -1,-1,1], "aVertexPosition", 3, false, this.skyboxProgram)
    this.skybox = vao
    this.textures.createCubemap(folder, this.skyboxProgram)*/
  }

  render() {
    const lightMatrix = this.renderShadowMap(this.params.show_shadow_map?"main":"shadowMap")
   
    if(!this.params.show_shadow_map){
      this.framebuffer.use("main")
      this.mainProgram.setMatrix4(this.matrices_names.shadowMap, lightMatrix)
      this.clear()
      this.objects.draw(this.mainProgram)

      if(this.skybox != null){
        /*let viewProjection = glMatrix.mat4.create()
        glMatrix.mat4.multiply(viewProjection, this.camera.projection, this.camera.view)
        this.skyboxProgram.setMatrix4("uViewProjection", viewProjection)
        this.gl.bindVertexArray(this.skybox)
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)*/
      }

    }
  }
}