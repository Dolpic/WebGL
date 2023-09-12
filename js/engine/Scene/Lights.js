import * as Utils from "../utils.js"
import SceneComponent from "./SceneComponent.js"

export default class Lights extends SceneComponent{
    constructor(program){
        super(program)
        this.ambientColor  = null
        this.dirColor      = null
        this.dirDirection  = null
        this.pointColor    = null
        this.pointPos      = null
        this.coneColor     = null
        this.conePosition  = null
        this.coneDirection = null
    }

    applyToProgramInner(program){
        program.setVec3(Utils.names.lights.ambientColor,  this.ambientColor)
        program.setVec3(Utils.names.lights.dirColor,      this.dirColor)
        program.setVec3(Utils.names.lights.dirDirection,  this.dirDirection)
        program.setVec3(Utils.names.lights.pointColor,    this.pointColor)
        program.setVec3(Utils.names.lights.pointPos,      this.pointPos)
        program.setVec3(Utils.names.lights.coneColor,     this.coneColor)
        program.setVec3(Utils.names.lights.conePosition,  this.conePosition)
        program.setVec3(Utils.names.lights.coneDirection, this.coneDirection)
    }

    setAmbient(color=[1,1,1]){
        this.ambientColor = color
        this.applyToProgram()
    }
    
    setDirectional(color=[0,0,0], direction=[0,0,-1]){
        this.dirColor = color
        this.dirDirection = direction 
        this.applyToProgram()
    }

    setPoint(color=[0,0,0], position=[0,0,0]){
        this.pointColor = color
        this.pointPos = position
        this.applyToProgram()
    }

    setCone(color=[0,0,0], position=[0,0,0], direction=[0,0,-1]){
        this.coneDirectionDegree = direction
        const tmp = Utils.createMatrix()
        Utils.transformMatrix(tmp, [0,0,0], direction)
        Utils.inverseMatrix(tmp)
        this.coneDirection = [tmp[2],tmp[6],tmp[10]]
        this.coneColor = color
        this.conePosition = position
        this.applyToProgram()
    }

    getCone(){
        return {
            position:  this.conePosition,
            direction: this.coneDirectionDegree
        }
    }
}
