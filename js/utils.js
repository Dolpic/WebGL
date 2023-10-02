function getTransformSlidersValues(id){
    return [
        [getValue(id+"_TX"), getValue(id+"_TY"), getValue(id+"_TZ")], 
        [getValue(id+"_RX"), getValue(id+"_RY"), getValue(id+"_RZ")], 
        [getValue(id+"_SX"), getValue(id+"_SY"), getValue(id+"_SZ")]
    ]
}

function getMatrixValues(id){
    return getById(id+"_matrix").querySelectorAll("input").map(e => parseFloat(e.value))
}
function setMatrixValues(id, values){
    getById(id+"_matrix").querySelectorAll("input").forEach((e,i) => e.value = values[i].toFixed(2))
}
function generateMatrix(id, changeCallback="", values=[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]){
    function line(v){ return `<td><input value=${v} oninput="${changeCallback}"></input></td>` }
    function row(m, i){ return `<tr>${line(m[i])}${line(m[i+1])}${line(m[i+2])}${line(m[i+3])}</tr>` }
    let m = []
    values.forEach((e,i) => m[i] = e.toFixed(2))
    return `<table id='${id}_matrix' class='printedMatrix'>${row(m,0)}${row(m,4)}${row(m,8)}${row(m,12)}</table>`
}

function selectTab(tab, tab_selected, tabs_name){
    getChildren(tabs_name+"_content").forEach(child => {
        child.style.display = child.id == tab_selected ? "inline-block" : "none"
    })
    getChildren(tabs_name).forEach(child =>  child === tab ? child.classList.add("selectedTab") : child.classList.remove("selectedTab"))
}
function generateTabs(tabName, names_content){
    result = `<div id="${tabName}" class="tabs_list">`
    names_content.forEach(e => result += `<div onclick="selectTab(this, '${tabName}_${e[0]}', '${tabName}')">${e[0]}</div>`)
    result += `</div><div id="${tabName}_content" class="tabs_content">`
    names_content.forEach(e => result += `<div id="${tabName}_${e[0]}">${e[1]}</div>`)
    return result + `</div>`
}

/*function generateSliders(prefix, suffixes, min, max, title, default_values=null, on_input_func="", step=0.0001){
    let result = `<span>${title}</span><table>`
    suffixes.forEach( (e,i) =>{
        let value = default_values==null?(max+min)/2:default_values[i]
        result += "<tr><td>"+generateSlider(prefix, e, value, min, max, step, on_input_func)+"</td></tr>"
    })
    return result + "</table><hr>"
}

function generateSlider(name, id, value, min, max, step, oninput){
    let oninput_full = `getById('${id}_value').innerHTML = parseFloat(getById('${id}').value).toFixed(2);${oninput}`
    return `<table><tr>
        <td>${name}</td>
        <td><input oninput="${oninput_full}" type="range" id="${id}" value="${value}" min="${min}" max="${max}" step="${step}"/></td>
        <td id="${id}_value">${value.toFixed(2)}</td>
    </tr></table> `
}*/
