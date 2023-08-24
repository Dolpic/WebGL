class RenderingEngine{
  constructor(canvas, depth_test=true, depth_func=WebGL2RenderingContext.LEQUAL){
      this.gl = canvas.getContext("webgl2")
      this.aspectRatio = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight
      if (!this.gl) {
        alert("WebGL2 is not supported on this browser")
        return
      }
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0) 
      this.gl.clearDepth(1.0)            // Clear everything
      depth_test ? this.gl.enable(this.gl.DEPTH_TEST) : this.gl.disable(this.gl.DEPTH_TEST)
      this.gl.depthFunc(depth_func)
      this.objects = []
      this.lights = []
      this.texture_counter = 0
      this.matrices = {
        model:     "uModelMatrix",
        view:      "uViewMatrix",
        projection:"uProjectionMatrix"
      }
  }

  createAndCompileShader(type, source) {
    const shader = this.gl.createShader(type)
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
  
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      alert('Error : compiling the shaders: ' + this.gl.getShaderInfoLog(shader))
      this.gl.deleteShader(shader)
    }
    return shader
  }

  createProgram(vertexShader, fragmentShader) {
    this.program = this.gl.createProgram()
    this.gl.attachShader(this.program, this.createAndCompileShader(this.gl.VERTEX_SHADER,   vertexShader))
    this.gl.attachShader(this.program, this.createAndCompileShader(this.gl.FRAGMENT_SHADER, fragmentShader))
    this.gl.linkProgram(this.program)
    this.gl.useProgram(this.program)
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
        alert('Error : initializing the program : ' + this.gl.getProgramInfoLog(this.program))
        this.gl.deleteProgram(this.program)
    }
    this.setCamera()
    this.setAmbientLight()
    this.setDirectionalLight()
    this.setPointLight()
    this.setConeLight([0,0,0],[0,0,10])

  }

  createLightFramebufferProgram(lightVertexShader, lightFragmentShader){
    this.lightProgram = this.gl.createProgram()
    this.gl.attachShader(this.lightProgram, this.createAndCompileShader(this.gl.VERTEX_SHADER,   lightVertexShader))
    this.gl.attachShader(this.lightProgram, this.createAndCompileShader(this.gl.FRAGMENT_SHADER, lightFragmentShader))
    this.gl.linkProgram(this.lightProgram)
    this.gl.useProgram(this.lightProgram)
    if (!this.gl.getProgramParameter(this.lightProgram, this.gl.LINK_STATUS)) {
        alert('Error : initializing the light program : ' + this.gl.getProgramInfoLog(this.lightProgram))
        this.gl.deleteProgram(this.lightProgram)
    }

    this.depthTexture = this.gl.createTexture()
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture)
    //this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT32F, 512, 512, 0, this.gl.DEPTH_COMPONENT, this.gl.FLOAT, null)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 512, 512, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null)
    
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    
    this.lightFramebuffer = this.gl.createFramebuffer()
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.lightFramebuffer)
    //this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.depthTexture, 0)
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.depthTexture, 0)
    
    
    this.gl.useProgram(this.program)
    this.gl.uniform1i(this.gl.getUniformLocation(this.program, "uTexture"), 0)
  }

  createBuffer(data, location_name, nbComponents, normalize=false){
    //this.debugProgram(this.program)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer())
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW) // Note : change this if the shape changes dynamically
    const location = this.gl.getAttribLocation(this.program, location_name)
    this.gl.enableVertexAttribArray(location)
    this.gl.vertexAttribPointer(location, nbComponents, this.gl.FLOAT, normalize, 0, 0)
  }

  setTexture(image, location_name){
    const texture = this.gl.createTexture()
    this.gl.activeTexture(this.gl.TEXTURE0) // To change if more textures
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image)
    this.gl.generateMipmap(this.gl.TEXTURE_2D)
    this.gl.uniform1i(this.gl.getUniformLocation(this.program, location_name), this.texture_counter)
    this.texture_counter++
  }

  addObject(obj, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
    // Note : is it possible to not repeat the points that are at the same place (ex : only 8 vertex for a cube) ?
    const converted = processBuffers(obj)
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)
    this.createBuffer(new Float32Array(converted.positions), "aVertexPosition", 3)
    this.createBuffer(new Float32Array(converted.colors),    "aVertexColor",    4)
    this.createBuffer(new Float32Array(converted.normals),   "aVertexNormal",   3)
    if(obj.texture != null){
      /*this.createBuffer(new Float32Array(converted.texture_coord), "aTextureCoord", 2, true)
      let image = new Image()
      image.src = obj.texture
      image.onload = () => this.setTexture(image, "uTexture")*/
    }
    this.objects.push({
      vao:vao, 
      count:converted.count,
      modelMatrix:createTransformMatrix(position, rotation, scale)
    })
  }

  setMatrix(name, value){
    this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), name), false, value)
  }

  setCamera(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1], fov=45, zNear=0.1, zFar=1000.0){
    const project = glMatrix.mat4.create()
    glMatrix.mat4.perspective(project, fov*Math.PI/180, this.aspectRatio, zNear, zFar)
    this.setMatrix(this.matrices.projection, project)
    
    const view = createTransformMatrix(position, rotation, scale)
    glMatrix.mat4.invert(view, view) // The view matrix is the inverse of the camera matrix
    this.setMatrix(this.matrices.view, view)
    return {projection:project, view:view}
  }


  setAmbientLight(color=[1,1,1]){
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uAmbientLightColor'), color)
  }

  setDirectionalLight(color=[0,0,0], direction=[0,0,-1]){
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uDirectionalLightColor'),     color)
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightDirectionDirectional'), direction)
  }

  setPointLight(color=[0,0,0], position=[0,0,-1]){
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uPointLightColor'),    color)
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightPositionPoint'), position)
  }

  setConeLight(color=[0,0,0], position=[0,0,-1], direction=[0,0,-1]){
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uConeLightColor'),     color)
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightPositionCone'),  position)
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uConeLightDirection'), direction)
    this.lightPosition = position
    this.lightDirection = direction
  }

  render() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

    const DEBUG = false
    

    if(DEBUG){
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
    }else{
       this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.lightFramebuffer)
    }

    this.gl.viewport(0, 0, 512, 512)
    this.gl.useProgram(this.lightProgram)

    const view = createTransformMatrix(this.lightPosition,this.lightDirection)
    glMatrix.mat4.invert(view, view)
    this.setMatrix("uViewMatrix", view)

    const project = glMatrix.mat4.create()
    glMatrix.mat4.identity(project)
    const ortho_size = [20,20]
    glMatrix.mat4.ortho(project, -ortho_size[0]/2, ortho_size[0]/2, -ortho_size[1]/2, ortho_size[1]/2, 0.1, 100)
    this.setMatrix(this.matrices.projection, project)
    
    this.objects.forEach(obj => {
      this.gl.bindVertexArray(obj.vao)
      this.setMatrix(this.matrices.model, obj.modelMatrix)
      this.gl.drawArrays(this.gl.TRIANGLES, 0, obj.count)
    })

    if(!DEBUG){
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
      this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
      this.gl.useProgram(this.program)

      const lightMatrix = glMatrix.mat4.create()
      //glMatrix.mat4.identity(view)


      glMatrix.mat4.translate(lightMatrix, lightMatrix, [0.5,0.5,0.5])
      glMatrix.mat4.scale(lightMatrix,lightMatrix, [0.5,0.5,0.5])
      glMatrix.mat4.multiply(lightMatrix, lightMatrix, project)
      glMatrix.mat4.invert(view, view)
      glMatrix.mat4.multiply(lightMatrix, lightMatrix, view)
      this.setMatrix("uLightMatrix", lightMatrix)
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, "uTexture"), 0)

      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
      this.objects.forEach(obj => {
        this.gl.useProgram(this.program)
        this.gl.bindVertexArray(obj.vao)
        this.setMatrix(this.matrices.model, obj.modelMatrix)
        this.gl.drawArrays(this.gl.TRIANGLES, 0, obj.count)
      })
    }

  }

  debugProgram(program){
    console.log("Program informations :")
    console.log("Attributes : ")
    for(let i=0; i<this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES); i++){
      console.log(this.gl.getActiveAttrib(program, i))
    }
    console.log("Uniforms : ")
    for(let i=0; i<this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS); i++){
      console.log(this.gl.getActiveUniform(program, i))
    }
    console.log("Shaders : ")
    console.log(this.gl.getAttachedShaders(program))
  }
}