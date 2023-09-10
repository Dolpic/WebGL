import * as Utils from "../utils.js"
import "../gl-matrix.js"

export default class Camera{
    constructor(program, aspectRatio, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1], fov=45, zNear=0.1, zFar=200.0){
        this.program = program
        this.setProjection(aspectRatio, fov, zNear, zFar)
        this.setView(position, rotation, scale)
    }
    
    setProjection(aspectRatio, fov=45, zNear=0.1, zFar=200.0){
        const proj = glMatrix.mat4.create()
        glMatrix.mat4.perspective(proj, fov*Math.PI/180, aspectRatio, zNear, zFar)
        this.setMatrixProjection(proj)
    }

    setOrthoProjection(left, right, bottom, top, near, far){
        const proj = glMatrix.mat4.create()
        glMatrix.mat4.ortho(proj, left, right, bottom, top, near, far)
        this.setMatrixProjection(proj)
    }
    
    setView(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        const view = Utils.createTransformMatrix(position, rotation, scale)
        this.setMatrixView(view)
    }

    setCamera(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        const view = Utils.matInverse(Utils.createTransformMatrix(position, rotation, scale))
        this.setMatrixView(view)
    }

    getMatrices(){
        return {view:this.view, projection:this.projection}
    }

    setMatrixView(view){
        this.view = view
        this.program.setMatrix4(Utils.names.mat.view, this.view)
    }

    setMatrixProjection(projection){
        this.projection = projection
        this.program.setMatrix4(Utils.names.mat.projection, this.projection)
    }
}