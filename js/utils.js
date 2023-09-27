function getTransformSlidersValues(id){
    return [
        [getValue(id+"_TX"), getValue(id+"_TY"), getValue(id+"_TZ")], 
        [getValue(id+"_RX"), getValue(id+"_RY"), getValue(id+"_RZ")], 
        [getValue(id+"_SX"), getValue(id+"_SY"), getValue(id+"_SZ")]
    ]
}
function generateTransformSliders(id, changeCallback, values=[[0,0,0],[0,0,0],[1,1,1]]){
    return (
        generateSliders(id+"_T",  ["X","Y","Z"], -100,  100, "Translation", values[0], changeCallback) +
        generateSliders(id+"_R",  ["X","Y","Z"], -180,  180, "Rotation",    values[1], changeCallback) +
        generateSliders(id+"_S",  ["X","Y","Z"], 0.001, 5,   "Scale",       values[2], changeCallback)
    )
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

function generateSliders(prefix, suffixes, min, max, title, default_values=null, on_input_func="", step=0.0001){
    let result = `<span>${title}</span><table>`
    suffixes.forEach( (e,i) =>{
        let id = prefix+e
        let value = default_values == null ? (max+min)/2 : default_values[i]
        let id_value = id+"_value"
        let on_input = `getById('${id_value}').innerHTML = parseFloat(getById('${id}').value).toFixed(2);${on_input_func}`
        result += `
        <tr>
            <td>${e}</td>
            <td><input oninput="${on_input}" type="range" id="${id}" value="${value}" min="${min}" max="${max}" step="${step}"/></td>
            <td id="${id_value}">${value.toFixed(2)}</td>
        </tr>`
    })
    return result + "</table><hr>"
}
