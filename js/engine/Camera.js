import * as Utils from "./utils.js"
import "./gl-matrix.js"

export default class Camera{
    constructor(engine, program, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1], fov=45, zNear=0.1, zFar=200.0){
        this.engine = engine
        this.program = program
        this.setProjection(fov, zNear, zFar)
        this.setView(position, rotation, scale)
    }
    
    setProjection(fov=45, zNear=0.1, zFar=200.0){
        let aspectRatio = this.engine.canvasSize.width/this.engine.canvasSize.height
        this.projection = glMatrix.mat4.create()
        glMatrix.mat4.perspective(this.projection, fov*Math.PI/180, aspectRatio, zNear, zFar)
        this.program.setMatrix4(this.engine.matrices_names.projection, this.projection)
    }

    setOrthoProjection(left, right, bottom, top, near, far){
        this.projection = glMatrix.mat4.create()
        glMatrix.mat4.ortho(this.projection, left, right, bottom, top, near, far)
        this.program.setMatrix4(this.engine.matrices_names.projection, this.projection)
    }
    
    setView(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        this.view = Utils.createTransformMatrix(position, rotation, scale)
        this.program.setMatrix4(this.engine.matrices_names.view, this.view)
    }

    setCamera(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        this.setView(position, rotation, scale)
        glMatrix.mat4.invert(this.view, this.view)
        this.program.setMatrix4(this.engine.matrices_names.view, this.view)
    }

    getMatrices(){
        return {view:this.view, projection:this.projection}
    }
}