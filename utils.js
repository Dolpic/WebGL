function computeNormal(v1, v2, v3){
    const p1 = glMatrix.vec3.fromValues(v1[0], v1[1], v1[2])
    const p2 = glMatrix.vec3.fromValues(v2[0], v2[1], v2[2])
    const p3 = glMatrix.vec3.fromValues(v3[0], v3[1], v3[2])

    var u = glMatrix.vec3.create()
    glMatrix.vec3.sub(u, p1, p2)

    var v = glMatrix.vec3.create()
    glMatrix.vec3.sub(v, p1, p3)

    var res = glMatrix.vec3.create()
    glMatrix.vec3.cross(res, u, v)
    glMatrix.vec3.normalize(res, res)
    return res
}

function processBuffers(obj){
    const faces = obj.faces
    const vertices = obj.vertices
    const colors = obj.colors
    const texCoord = obj.texture_coord

    var newPositions = []
    var newColors    = []
    var newTexCoord  = []
    var normals      = []
    var normalVertex1 = []
    var normalVertex2 = []
    var normalVertex3 = []
    
    for(var i=0; i < faces.length; i++){
        newPositions.push(vertices[faces[i]*3])
        newPositions.push(vertices[faces[i]*3+1])
        newPositions.push(vertices[faces[i]*3+2])
        if(obj.texture != null){
            newTexCoord.push(texCoord[faces[i]*2])
            newTexCoord.push(texCoord[faces[i]*2+1])
        }

        newColors.push(colors[faces[i]*4])
        newColors.push(colors[faces[i]*4+1])
        newColors.push(colors[faces[i]*4+2])
        newColors.push(colors[faces[i]*4+3])

        if(i%3==0){
            normalVertex1 = [
                vertices[faces[i]*3],
                vertices[faces[i]*3+1],
                vertices[faces[i]*3+2]
            ]
        }else if(i%3==1){
            normalVertex2 = [
                vertices[faces[i]*3],
                vertices[faces[i]*3+1],
                vertices[faces[i]*3+2]
            ]
        }else{
            normalVertex3 = [
                vertices[faces[i]*3],
                vertices[faces[i]*3+1],
                vertices[faces[i]*3+2]
            ]

            const normal = computeNormal(normalVertex1, normalVertex2, normalVertex3)
            normals.push(normal[0])
            normals.push(normal[1])
            normals.push(normal[2])
            normals.push(normal[0])
            normals.push(normal[1])
            normals.push(normal[2])
            normals.push(normal[0])
            normals.push(normal[1])
            normals.push(normal[2])
        }
    }
    return {
        positions:newPositions, 
        colors:newColors, 
        normals:normals,
        texture_coord:newTexCoord,
        count:newPositions.length/3
    }
}

function createTransformMatrix(position, rotation, scale=[1,1,1]){
    const model = glMatrix.mat4.create()
    glMatrix.mat4.translate(model, model, position)
    glMatrix.mat4.rotateX(  model, model, rotation[0]*Math.PI/180)
    glMatrix.mat4.rotateY(  model, model, rotation[1]*Math.PI/180)
    glMatrix.mat4.rotateZ(  model, model, rotation[2]*Math.PI/180)
    glMatrix.mat4.scale(    model, model, scale)
    return model
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

function generateSliders(prefix, sufffixes, min, max, title, default_values = null, add_on_input="", step=0.0001){
    let result = `<details><summary>${title}</summary><table>`
    sufffixes.forEach( (e,i) =>{
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

