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
