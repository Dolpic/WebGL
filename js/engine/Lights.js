import * as Utils from "./utils.js"
import "./gl-matrix.js"

export default class Lights{
    constructor(engine, program){
        this.program = program
        this.setAmbient()
        this.setDirectional()
        this.setPoint()
        this.setCone([0,0,0],[0,0,10])
    }

    setAmbient(color=[1,1,1]){
        this.program.setVec3('uLightAmbientColor', color)
    }
    
    setDirectional(color=[0,0,0], direction=[0,0,-1]){
        this.program.setVec3('uLightDirectionalColor',     color)
        this.program.setVec3('uLightDirectionalDirection', direction)
    }

    setPoint(color=[0,0,0], position=[0,0,-1]){
        this.program.setVec3('uLightPointColor',    color)
        this.program.setVec3('uLightPointPosition', position)
    }

    setCone(color=[0,0,0], position=[0,0,-1], direction=[0,0,-1]){
        let view = Utils.createTransformMatrix([0,0,0], direction)
        glMatrix.mat4.invert(view, view)
        let real_dir = [view[2],view[6],view[10]]
        this.program.setVec3('uLightConeColor',     color)
        this.program.setVec3('uLightConePosition',  position)
        this.program.setVec3('uLightConeDirection', real_dir)
        this.conePosition = position
        this.coneDirection = direction
    }
}
