export function createTransformMatrix(position, rotation, scale=[1,1,1]){
    const model = glMatrix.mat4.create()
    glMatrix.mat4.translate(model, model, position)
    glMatrix.mat4.rotateX(  model, model, rotation[0]*Math.PI/180)
    glMatrix.mat4.rotateY(  model, model, rotation[1]*Math.PI/180)
    glMatrix.mat4.rotateZ(  model, model, rotation[2]*Math.PI/180)
    glMatrix.mat4.scale(    model, model, scale)
    return model
}

export function loadImage(src, callback){
    let img = new Image()
    img.src = src
    img.onload = () => callback(img)
}


export function setDefaultParams(params){
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

export function printDebugProgram(gl, program){
    console.log("Program informations :")
    console.log("Attributes : ")
    for(let i=0; i<gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES); i++){
      console.log(gl.getActiveAttrib(program, i))
    }
    console.log("Uniforms : ")
    for(let i=0; i<gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++){
      console.log(gl.getActiveUniform(program, i))
    }
    console.log("Shaders : ")
    console.log(gl.getAttachedShaders(program))
}