import * as Utils from "../utils.js"

export default class Lights{
    constructor(onchange){
        this.onchange = onchange
        this.setAmbient([1,1,1])
        this.setDirectional([0,0,0], [0,0,-1])
        this.setPoint([0,0,0], [0,0,0])
        this.setCone([0,0,0], [0,0,0], [0,0,-1])
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

    setAmbient(color){
        this.ambientColor = color
        this.update()
    }
    
    setDirectional(color=null, direction=null){
        this.dirColor     = color==null?this.dirColor:color
        this.dirDirection = direction==null?this.dirDirection:direction
        this.update()
    }

    setPoint(color=null, position=null){
        this.pointColor = color==null?this.pointColor:color
        this.pointPos   = position==null?this.pointPos:position
        this.update()
    }

    setCone(color=null, position=null, direction=null){
        this.coneColor    = color==null?this.coneColor:color
        this.conePosition = position==null?this.conePosition:position
        this.coneDirectionDegree = direction==null?this.coneDirectionDegree:direction

        const tmp = Utils.createMatrix()
        Utils.transformMatrix(tmp, [0,0,0], this.coneDirectionDegree)
        Utils.inverseMatrix(tmp)
        this.coneDirection = [tmp[2],tmp[6],tmp[10]]
        this.update()
    }
}
