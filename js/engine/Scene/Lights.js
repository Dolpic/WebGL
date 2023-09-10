import * as Utils from "../utils.js"

export default class Lights{
    constructor(program){
        this.program = program
        this.setAmbient()
        this.setDirectional()
        this.setPoint()
        this.setCone()
    }

    setAmbient(color=[1,1,1]){
        this.program.setVec3(Utils.names.lights.ambientColor, color)
    }
    
    setDirectional(color=[0,0,0], direction=[0,0,-1]){
        this.program.setVec3(Utils.names.lights.dirColor,     color)
        this.program.setVec3(Utils.names.lights.dirDirection, direction)
    }

    setPoint(color=[0,0,0], position=[0,0,0]){
        this.program.setVec3(Utils.names.lights.pointColor, color)
        this.program.setVec3(Utils.names.lights.pointPos,   position)
    }

    setCone(color=[0,0,0], position=[0,0,0], direction=[0,0,-1]){
        let view = Utils.matInverse(Utils.createTransformMatrix([0,0,0], direction))
        let real_dir = [view[2],view[6],view[10]]
        this.program.setVec3(Utils.names.lights.coneColor,     color)
        this.program.setVec3(Utils.names.lights.conePosition,  position)
        this.program.setVec3(Utils.names.lights.coneDirection, real_dir)
        this.conePosition = position
        this.coneDirection = direction
    }
}
