function createTransformMatrix(position, rotation, scale=[1,1,1]){
    const model = glMatrix.mat4.create()
    glMatrix.mat4.translate(model, model, position)
    glMatrix.mat4.rotateX(  model, model, rotation[0]*Math.PI/180)
    glMatrix.mat4.rotateY(  model, model, rotation[1]*Math.PI/180)
    glMatrix.mat4.rotateZ(  model, model, rotation[2]*Math.PI/180)
    glMatrix.mat4.scale(    model, model, scale)
    return model
}

function loadImage(src, callback){
    let img = new Image()
    img.src = src
    img.onload = () => callback(img)
}

function setDefaultParams(params){
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

function printDebugProgram(gl, program){
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

function printMatrix(container, matrix, title="", callback=""){
    function line(v){
        return `<td><input value=${v} oninput="${callback}"></input></td>`
    }
    function row(m, i){
        return `<tr>${line(m[i])}${line(m[i+1])}${line(m[i+2])}${line(m[i+3])}</tr>`
    }
    let m = []
    matrix.forEach((e,i) => m[i] = e.toFixed(2))
    if(container.innerHTML == ""){
        container.innerHTML=`
        <h3>${title}</h3>
        <table class='printedMatrix'>
            ${row(m,0)}${row(m,4)}${row(m,8)}${row(m,12)}
        </table>`
    }else{
        inputs = container.querySelectorAll("input")
        inputs.forEach((e,i) => e.value = m[i])
    }
}

function generateSliders(prefix, suffixes, min, max, title, default_values = null, add_on_input="", step=0.0001){
    let result = `<details><summary>${title}</summary><table>`
    suffixes.forEach( (e,i) =>{
        let id = prefix+e
        let value = default_values == null ? (max+min)/2 : default_values[i]
        let id_value = id+"_value"
        let on_input = `getById('${id_value}').innerHTML = parseFloat(getById('${id}').value).toFixed(2);${add_on_input}`

        result += `
        <tr>
            <td>${e}</td>
            <td>
                <input oninput="${on_input}" type="range" id="${id}" value="${value}" min="${min}" max="${max}" step="${step}"/>
            </td>
            <td id="${id_value}">${value.toFixed(2)}</td>
        </tr>`
    })
    result += "</table></details>"
    return result
}

