import * as Utils from "../utils.js"
import "../gl-matrix.js"
import SceneComponent from "./SceneComponent.js"

export default class Camera extends SceneComponent{
    constructor(program, aspectRatio, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1], fov=45, zNear=0.1, zFar=200.0){
        super(program)
        this.view       = glMatrix.mat4.create()
        this.projection = glMatrix.mat4.create()
        this.setProjection(aspectRatio, fov, zNear, zFar)
        this.setView(position, rotation, scale)
    }

    applyToProgramInner(program){
        program.setMatrix4(Utils.names.mat.view, this.view)
        program.setMatrix4(Utils.names.mat.projection, this.projection)
    }
    
    setProjection(aspectRatio, fov=45, zNear=0.1, zFar=200.0){
        glMatrix.mat4.perspective(this.projection, fov*Math.PI/180, aspectRatio, zNear, zFar)
        this.applyToProgram()
    }

    setOrthoProjection(left, right, bottom, top, near, far){
        glMatrix.mat4.ortho(this.projection, left, right, bottom, top, near, far)
        this.applyToProgram()
    }
    
    setView(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        Utils.transformMatrix(this.view, position, rotation, scale)
        this.applyToProgram()
    }

    setCamera(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]){
        Utils.transformMatrix(this.view, position, rotation, scale)
        Utils.inverseMatrix(this.view)
        this.applyToProgram()
    }

    getMatrices(){
        return {
            view:this.view, 
            projection:this.projection
        }
    }

    setMatrixView(view){
        this.view = view
        this.applyToProgram()
    }

    setMatrixProjection(projection){
        this.projection = projection
        this.applyToProgram()
    }
}