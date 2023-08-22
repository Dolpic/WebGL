

function initBuffers(gl) {

  const positions = new Float32Array([
    1.0,  1.0, 0.0,
    1.5,  1.0, 0.0,
    1.0,  1.5, 0.0,
   -1.0, -1.0, 0.0,
   -1.5, -1.0, 0.0,
   -1.0, -1.5, 0.0,
  ])
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const colors = new Float32Array([
    1.0,  1.0,  1.0,  1.0,    // blanc
    1.0,  1.0,  1.0,  1.0,    // blanc
    1.0,  1.0,  1.0,  1.0,    // blanc
    1.0,  0.0,  0.0,  1.0,    // rouge
    1.0,  0.0,  0.0,  1.0,    // rouge
    1.0,  0.0,  0.0,  1.0,    // rouge
  ])
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

  const indices = new Uint16Array([
    0, 1, 2, 
    3, 4, 5
  ])
  const indicesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);


  return {
    position: positionBuffer,
    colors:   colorBuffer,
    indices:  indicesBuffer
  };
}


var squareRotation = 0
function drawScene(gl, programInfo, buffers, deltaTime) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  const fieldOfView = 45 * Math.PI / 180
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
  const zNear = 0.1
  const zFar = 100.0

  const projectionMatrix = glMatrix.mat4.create()
  glMatrix.mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

  // Set the drawing position to the "identity" point, which is the center of the scene.
  const modelViewMatrix = glMatrix.mat4.create()
  glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0])

  squareRotation += deltaTime/1000
  glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, squareRotation, [0, 2, 1])


  const numComponents = 3;  // pull out 2 values per iteration
  const type = gl.FLOAT;    // the data in the buffer is 32bit floats
  const normalize = false;  // don't normalize
  const stride = 0;         // how many bytes to get from one set of values to the next, 0 = use type and numComponents above
  const vertexOffset = 0;   // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      vertexOffset);
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

  // Indiquer à WebGL comment transférer les couleurs du tampon des couleurs dans l'attribut vertexColor.
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,  false, modelViewMatrix);

  
  {
    const numComponents = 6;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, numComponents, type, offset);
  }

}
