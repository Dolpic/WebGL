import "./gl-matrix.js"

export function transformMatrix(output, position, rotation, scale=[1,1,1]){
    glMatrix.mat4.identity( output)
    glMatrix.mat4.translate(output, output, position)
    glMatrix.mat4.rotateX(  output, output, rotation[0]*Math.PI/180)
    glMatrix.mat4.rotateY(  output, output, rotation[1]*Math.PI/180)
    glMatrix.mat4.rotateZ(  output, output, rotation[2]*Math.PI/180)
    glMatrix.mat4.scale(    output, output, scale)
}

export function inverseMatrix(matrix){
    glMatrix.mat4.invert(matrix, matrix)
}

export function createMatrix(){
    return glMatrix.mat4.create()
}

export function getTranslation(mat){
    return [mat[12], mat[13], mat[14]]
}

export function getTransform(mat){
    let translation = []
    let q = []
    let scale = []
    glMatrix.mat4.decompose(q, translation, scale, mat)

    let rotx = (180/Math.PI)* Math.atan2(2*(q[3]*q[0] + q[1]*q[2]), 1-2*(q[0]*q[0]+q[1]*q[1]))
    let roty = (180/Math.PI)* Math.asin(2*(q[3]*q[1] - q[0]*q[3]))
    let rotz = (180/Math.PI)* Math.atan2(2*(q[3]*q[0] + q[0]*q[1]), 1-2*(q[1]*q[1]+q[2]*q[2]))

    return {translation:translation, rotation:[rotx,roty,rotz], scale:scale}
}
