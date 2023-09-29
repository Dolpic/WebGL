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
    return [mat[12], mat[13], mat[13]]
}
