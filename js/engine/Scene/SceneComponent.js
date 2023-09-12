export default class SceneComponent{
    constructor(program = null){
        this.programs = []
        if(program != null){
            this.bindProgram(program)
        }
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