import "./gl-matrix.js"

// TODO : avoid allocating in these two functions
export function createTransformMatrix(position, rotation, scale=[1,1,1]){
    const model = glMatrix.mat4.create()
    glMatrix.mat4.translate(model, model, position)
    glMatrix.mat4.rotateX(  model, model, rotation[0]*Math.PI/180)
    glMatrix.mat4.rotateY(  model, model, rotation[1]*Math.PI/180)
    glMatrix.mat4.rotateZ(  model, model, rotation[2]*Math.PI/180)
    glMatrix.mat4.scale(    model, model, scale)
    return model
}

export function matInverse(matrice){
    const result = glMatrix.mat4.create()
    glMatrix.mat4.invert(result, matrice)
    return result
}

export const names = {
    attrs: {
        position: "aPosition",
        color:    "aColor",
        texCoord: "aTexCoord",
        normal:   "aNormal",
    },
    lights:{
        ambientColor:  "uLightAmbientColor",
        pointPos:      "uLightPointPosition",
        pointColor:    "uLightPointColor",
        dirDirection:  "uLightDirectionalDirection",
        dirColor:      "uLightDirectionalColor",
        conePosition:  "uLightConePosition",
        coneDirection: "uLightConeDirection",
        coneColor:     "uLightConeColor"
    },
    mat:{
        model:      "uMatrixModel",
        view:       "uMatrixView",
        projection: "uMatrixProjection",
        shadowMap:  "uMatrixShadowMap"
    },
    tex:{
        texture:   "uTexture",
        shadowMap: "uShadowMap",
        cubemap:   "uCubemap"
    }
}
