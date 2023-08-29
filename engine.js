class RenderingEngine{
  constructor(canvas, shader, shadowMapShader, params={}){
      if (! (this.gl = canvas.getContext("webgl2")) ){
        alert("WebGL2 is not supported on this browser")
      }
      this.aspectRatio = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight
      this.params = setDefaultParams(params)
      this.gl.clearColor(...this.params.clear_color) 
      this.gl.clearDepth(this.params.clear_depth)

      this.params.depth_test ? this.gl.enable(this.gl.DEPTH_TEST) : this.gl.disable(this.gl.DEPTH_TEST)
      this.gl.depthFunc(this.params.depth_test_function)

      this.objects = []
      this.lights  = []
      this.texture_counter = 0

      this.matrices_names = {
        model:     "uMatrixModel",
        view:      "uMatrixView",
        projection:"uMatrixProjection"
      }

      this.program = this.createProgram(shader)
      this.shadowMapProgram = this.createProgram(shadowMapShader)
      this.lightFramebuffer = this.createShadowmapFramebuffer()
      this.initScene()
  }

  initScene(){
    this.setCamera()
    this.setAmbientLight()
    this.setDirectionalLight()
    this.setPointLight()
    this.setConeLight([0,0,0],[0,0,10])
  }

  createCompileShader(type, source) {
    const shader = this.gl.createShader(type)
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      alert('Error compiling the shaders: ' + this.gl.getShaderInfoLog(shader))
    }
    return shader
  }

  createProgram(shader) {
    let program = this.gl.createProgram()
    this.gl.attachShader(program, this.createCompileShader(this.gl.VERTEX_SHADER,   shader.vertex))
    this.gl.attachShader(program, this.createCompileShader(this.gl.FRAGMENT_SHADER, shader.fragment))
    this.gl.linkProgram(program)
    this.gl.useProgram(program)
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        alert('Error initializing the program : ' + this.gl.getProgramInfoLog(program))
    }
    return program
  }

  createTexture(image, location_name, with_mipmap=true, depth_texture=false){
    const texture = this.gl.createTexture()
    this.gl.activeTexture(this.gl["TEXTURE"+this.texture_counter])
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    if(depth_texture){
      const size = this.params.shadow_map_size
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT32F, size, size, 0, this.gl.DEPTH_COMPONENT, this.gl.FLOAT, null)
    }else{
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image)
    }
    
    if(with_mipmap) this.gl.generateMipmap(this.gl.TEXTURE_2D)
    this.gl.useProgram(this.program)
    this.gl.uniform1i(this.gl.getUniformLocation(this.program, location_name), this.texture_counter)
    this.texture_counter++ // TODO : Should add a warning if no more texture can be created
    return texture
  }

  createShadowmapFramebuffer(){
    const depthTexture = this.createTexture(null, "uShadowMap", false, true)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
    const lightFramebuffer = this.gl.createFramebuffer()
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, lightFramebuffer)
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, depthTexture, 0)
    return lightFramebuffer
  }

  createBuffer(data, location_name, nbComponents, normalize=false){
    //this.debugProgram(this.program)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer())
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW) // Note : change this if the shape changes dynamically
    const location = this.gl.getAttribLocation(this.program, location_name)
    this.gl.enableVertexAttribArray(location)
    this.gl.vertexAttribPointer(location, nbComponents, this.gl.FLOAT, normalize, 0, 0)
  }

  addObject(obj, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
    // Note : is it possible to not repeat the points that are at the same place (ex : only 8 vertex for a cube) ?
    const converted = processBuffers(obj)
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)
    this.createBuffer(converted.positions, "aVertexPosition", 3)
    this.createBuffer(converted.colors,    "aVertexColor",    4)
    this.createBuffer(converted.normals,   "aVertexNormal",   3)
    if(obj.texture != null){
      this.createBuffer(converted.texture_coord, "aTextureCoord", 2, true)
      let image = new Image()
      image.src = obj.texture
      image.onload = () => this.createTexture(image, "uTexture")
    }
    let new_obj = {vao:vao, count:converted.count}
    this.setObjectTransform(new_obj, position, rotation, scale)
    this.objects.push(new_obj)
    return new_obj
  }

  setObjectTransform(obj, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
    obj.modelMatrix = createTransformMatrix(position, rotation, scale)
  }

  setMatrix(name, value){
    this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), name), false, value)
  }

  setCamera(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1], fov=45, zNear=0.1, zFar=200.0){
    const project = glMatrix.mat4.create()
    glMatrix.mat4.perspective(project, fov*Math.PI/180, this.aspectRatio, zNear, zFar)
    const view = createTransformMatrix(position, rotation, scale)
    //glMatrix.mat4.invert(view, view) // The view matrix is the inverse of the camera matrix
    this.setMatrix(this.matrices_names.projection, project)
    this.setMatrix(this.matrices_names.view, view)
    return {projection:project, view:view}
  }

  setAmbientLight(color=[1,1,1]){
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightAmbientColor'), color)
  }

  setDirectionalLight(color=[0,0,0], direction=[0,0,-1]){
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightDirectionalColor'),     color)
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightDirectionalDirection'), direction)
  }

  setPointLight(color=[0,0,0], position=[0,0,-1]){
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightPointColor'),    color)
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightPointPosition'), position)
  }

  setConeLight(color=[0,0,0], position=[0,0,-1], direction=[0,0,-1]){
    let view = createTransformMatrix([0,0,0], direction)
    glMatrix.mat4.invert(view, view)
    let real_dir = [view[2],view[6],view[10]]
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightConeColor'),     color)
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightConePosition'),  position)
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightConeDirection'), real_dir)
    this.lightPosition = position
    this.lightDirection = direction
  }

  drawObjects(){
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.objects.forEach(obj => {
      this.gl.bindVertexArray(obj.vao)
      this.setMatrix(this.matrices_names.model, obj.modelMatrix)
      this.gl.drawArrays(this.gl.TRIANGLES, 0, obj.count)
    })
  }

  render() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.params.show_shadow_map ? null : this.lightFramebuffer)
    this.gl.viewport(0, 0, this.params.shadow_map_size, this.params.shadow_map_size)
    this.gl.useProgram(this.shadowMapProgram)

    let view = createTransformMatrix(this.lightPosition, this.lightDirection)
    glMatrix.mat4.invert(view, view)
    this.setMatrix(this.matrices_names.view, view)
    let project = glMatrix.mat4.create()
    glMatrix.mat4.ortho(project, -10, 10, -10, 10, 0.1, 200)
    this.setMatrix(this.matrices_names.projection, project)
    this.drawObjects()

    if(!this.params.show_shadow_map){
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
      this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
      this.gl.useProgram(this.program)

      const lightMatrix = glMatrix.mat4.create()
      glMatrix.mat4.identity(lightMatrix)
      glMatrix.mat4.translate(lightMatrix, lightMatrix, [0.5,0.5,0.5])
      glMatrix.mat4.scale(lightMatrix,lightMatrix, [0.5,0.5,0.5])
      glMatrix.mat4.multiply(lightMatrix, lightMatrix, project)
      glMatrix.mat4.multiply(lightMatrix, lightMatrix, view)
      this.setMatrix("uMatrixShadowMap", lightMatrix)
      this.drawObjects()
    }
  }
}