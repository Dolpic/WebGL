import * as Utils from "./utils.js"
import "./gl-matrix.js"

export default class Camera{
    constructor(engine, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1], fov=45, zNear=0.1, zFar=200.0){
        this.engine = engine
        this.program = this.engine.mainProgram
        this.setProjection(fov, zNear, zFar)
        this.setView(position, rotation, scale)
    }
    
    setProjection(fov=45, zNear=0.1, zFar=200.0, program=this.program){
        let aspectRatio = this.engine.canvasSize.width/this.engine.canvasSize.height
        this.projection = glMatrix.mat4.create()
        glMatrix.mat4.perspective(this.projection, fov*Math.PI/180, aspectRatio, zNear, zFar)
        program.setMatrix4(this.engine.matrices_names.projection, this.projection)
    }

    setOrthoProjection(left, right, bottom, top, near, far, program=this.program){
        this.projection = glMatrix.mat4.create()
        glMatrix.mat4.ortho(this.projection, left, right, bottom, top, near, far)
        program.setMatrix4(this.engine.matrices_names.projection, this.projection)
    }
    
    setView(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1], program=this.program){
        this.view = Utils.createTransformMatrix(position, rotation, scale)
        program.setMatrix4(this.engine.matrices_names.view, this.view)
    }

    setCamera(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1], program=this.program){
        this.view = Utils.createTransformMatrix(position, rotation, scale)
        glMatrix.mat4.invert(this.view, this.view)
        program.setMatrix4(this.engine.matrices_names.view, this.view)
    }

    getMatrices(){
        return {view:this.view, projection:this.projection}
    }
}