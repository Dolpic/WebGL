export default class SceneComponent{
    constructor(){
        this.programs = []
    }

    bindProgram(program){
        this.programs.push(program)
        this.applyToProgram()
    }

    applyToProgram(){
        this.programs.forEach(p => this.applyToProgramInner(p))
    }

    applyToProgramInner(){
        throw new Error("applyToProgram is not implemented")
    }
}