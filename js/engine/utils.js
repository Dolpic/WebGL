export function createTransformMatrix(position, rotation, scale=[1,1,1]){
    const model = glMatrix.mat4.create()
    glMatrix.mat4.translate(model, model, position)
    glMatrix.mat4.rotateX(  model, model, rotation[0]*Math.PI/180)
    glMatrix.mat4.rotateY(  model, model, rotation[1]*Math.PI/180)
    glMatrix.mat4.rotateZ(  model, model, rotation[2]*Math.PI/180)
    glMatrix.mat4.scale(    model, model, scale)
    return model
}
