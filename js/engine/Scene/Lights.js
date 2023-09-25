import * as Utils from "../utils.js"

export default class Lights{
    constructor(onchange){
        this.onchange = onchange
        this.setAmbient()
        this.setDirectional()
        this.setPoint()
        this.setCone()
    }

    getState(){
        return {
            ambientColor:     this.ambientColor,
            directionalColor: this.dirColor,
            directionalDir:   this.dirDirection,
            pointColor:       this.pointColor,
            pointPosition:    this.pointPos,
            coneColor:        this.coneColor,
            conePosition:     this.conePosition,
            coneDir:          this.coneDirection,
            coneDirDegree:    this.coneDirectionDegree
        }
    }

    update(){
        this.onchange(this.getState())
    }

    setAmbient(color=[1,1,1]){
        this.ambientColor = color
        this.update()
    }
    
    setDirectional(color=[0,0,0], direction=[0,0,-1]){
        this.dirColor = color
        this.dirDirection = direction 
        this.update()
    }

    setPoint(color=[0,0,0], position=[0,0,0]){
        this.pointColor = color
        this.pointPos = position
        this.update()
    }

    setCone(color=[0,0,0], position=[0,0,0], direction=[0,0,-1]){
        this.coneDirectionDegree = direction
        const tmp = Utils.createMatrix()
        Utils.transformMatrix(tmp, [0,0,0], direction)
        Utils.inverseMatrix(tmp)
        this.coneDirection = [tmp[2],tmp[6],tmp[10]]
        this.coneColor = color
        this.conePosition = position
        this.update()
    }
}
