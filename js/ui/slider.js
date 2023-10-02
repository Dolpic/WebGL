export default class Slider{
    constructor(parent_id, label, value=0, oninput="", min=0, max=1, step=0.0001, updateAfterCreation=true){
        this.parent_id = parent_id
        this.label     = label,
        this.value     = value,
        this.min       = min,
        this.max       = max,
        this.step      = step,
        this.oninput   = oninput
        this.updateAfterCreation = updateAfterCreation
        this.render()
    }

    render(){
        let container_id = this.parent_id+"_"+this.label
        let input_id = container_id+"_input"
        let value_id = container_id+"_value"
        if(document.getElementById(container_id) == null){
            let div = document.createElement("div")
            div.id = container_id
            document.getElementById(this.parent_id).appendChild(div)
        }

        document.getElementById(container_id).innerHTML = `
        <table>
            <tr>
                <td>${this.label}</td>
                <td>
                    <input type="range" id="${input_id}" value="${this.value}" min="${this.min}" max="${this.max}" step="${this.step}"/>
                </td>
                <td id="${value_id}"> ${this.value.toFixed(2)} </td>
            </tr>
        </table> `
        document.getElementById(input_id).addEventListener("input", () => {
            let val = document.getElementById(input_id).value
            document.getElementById(value_id).innerHTML=parseFloat(val).toFixed(2);
            this.oninput(val)
        })
        if(this.updateAfterCreation) this.oninput(this.value)
    }
}

export class SliderGroup{
    constructor(parent_id, labels, values, oninput, min, max, step=0.0001, updateAfterCreation=true){
        this.sliders = []
        labels.forEach( (label,i) => {
            document.getElementById(parent_id).innerHTML += `<div id="${parent_id}_${label}"></div>`
            let callback = () => oninput(labels.map(l => document.getElementById(parent_id+"_"+l+"_input").value))
            this.sliders.push(new Slider(parent_id, label, values[i], callback, min, max, step, (i==labels.length-1)&&updateAfterCreation)) 
        });
        this.render()
    }

    render(){
        this.sliders.forEach(s => s.render())
    }
}