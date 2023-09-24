import * as Utils from "../utils.js"
import "../gl-matrix.js"

export default class Camera{
    constructor(onchange, aspectRatio, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1], fov=45, zNear=0.1, zFar=200.0){
        this.onchange   = onchange
        this.view       = glMatrix.mat4.create()
        this.projection = glMatrix.mat4.create()
        this.setProjection(aspectRatio, fov, zNear, zFar)
        this.setView(position, rotation, scale)
    }

    getState(){
        return {
            view:     this.view, 
            projection:this.projection
        }
    }

    update(){
        this.onchange(this.getState())
    }
    
    setProjection(aspectRatio, fov=45, zNear=0.1, zFar=200.0){
        glMatrix.mat4.perspective(this.projection, fov*Math.PI/180, aspectRatio, zNear, zFar)
        this.update()
    }

    setOrthoProjection(left, right, bottom, top, near, far){
        glMatrix.mat4.ortho(this.projection, left, right, bottom, top, near, far)
        this.update()
    }
    
    setView(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        Utils.transformMatrix(this.view, position, rotation, scale)
        this.update()
    }

    setCamera(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        Utils.transformMatrix(this.view, position, rotation, scale)
        Utils.inverseMatrix(this.view)
        this.update()
    }

    setMatrixView(view){
        this.view = view
        this.update()
    }

    setMatrixProjection(projection){
        this.projection = projection
        this.update()
    }
}