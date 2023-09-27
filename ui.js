function generateShadersTab(){
    let programs = engine.scene.programs.programs
    let content = "<p>Dynamically generated shaders</p><hr>"
    for(let shader_name in programs){
        content += `
            <p>${shader_name}</p>
            <span>Vertex</span>
            <textarea readonly>${programs[shader_name].shaders.getVertex()}</textarea>
            <span>Fragment</span>
            <textarea readonly>${programs[shader_name].shaders.getFragment()}</textarea>
            <hr>
        `
    }
    getById("mainTab_Shaders").innerHTML = content
}

function generateObjectsTab(objs){
    let names_content = []
    Object.values(objs).forEach( (obj, i) => {
        let content = `Number of vertices : ${obj.count}<div id="objects_details_${i}_matrix"></div>`
        content += generateTransformSliders(obj.name, `updateObjectTab('${obj.name}', true)`)
        content += "<p>Model matrix :</p>"
        content += generateMatrix(obj.name, `updateObjectTab('${obj.name}', false)`, obj.modelMatrix)
        names_content.push([obj.name, content])
    })
    getById("mainTab_Objects").innerHTML = `
        <select id="model_selection">
            <option value="1">Standford Dragon</option> 
            <option value="2">Utah Teapot</option>
            <option value="3">Suzanne (blender)</option>  
            <option value="4">Gizmo</option>  
        </select>
        <button onclick="addModel()">Add</button>
        <hr>` + generateTabs("objectsTab", names_content)
}
function updateObjectTab(obj_name, fromSliders){
    const obj_list = Object.values(engine.objects.list)
    if(fromSliders){
        let obj_found = null 
        obj_list.forEach(obj => {
            if(obj.name == obj_name) {
                obj_found = obj
                engine.setObjectTransform(obj_name, ...getTransformSlidersValues(obj_name))
            }
        })
        setMatrixValues(obj_name, obj_found.modelMatrix)
    }else{
        let values = getMatrixValues(obj_name)
        obj_list.forEach(obj => {
            if(obj.name == obj_name) {
                obj.modelMatrix = values
            }
        })
    }
}

function generateViewTab(engine){
    getById("mainTab_View").innerHTML = (
        generateTransformSliders("view", "updateViewTab(true)", [[0,0,-26],[-71,0,-120],[1,1,1]]) +
        "<p>View matrix : </p>"+
        generateMatrix("view", `updateViewTab(false)`, engine.getViewProjection().view) 
    )
}
function updateViewTab(fromSliders){
    if(fromSliders){
        engine.scene.camera.setView(...getTransformSlidersValues("view"))
        setMatrixValues("view", engine.getViewProjection().view)
    }else{
        const values = getMatrixValues("view")
        engine.gl.useProgram(engine.program)
        engine.scene.camera.view = values
        engine.setViewProjection(values)
    }
}

function generateMaterialTab(){
    getById("mainTab_Material").innerHTML = (
        generateSliders("Specular",   ["Factor"], 0, 5, "Specular",   null,  "updateMaterialTab()") +
        generateSliders("Reflection", ["Factor"], 0, 1, "Reflection", [0.1], "updateMaterialTab()")
    )
}
function updateMaterialTab(){
    const specular = getValue("SpecularFactor")
    const reflection = getValue("ReflectionFactor")
    engine.scene.setMaterial(specular,reflection)
}

function generateLightsTab(){
    getById("mainTab_Lights").innerHTML = (
        generateSliders("AL",  ["R","G","B"], 0,    1,   "Ambiant light color",     [0,0,0]) +
        generateSliders("DL",  ["R","G","B"], 0,    1,   "Directional light color", [0,0,0]) +
        generateSliders("DL",  ["X","Y","Z"], -1,   1,   "Directional light direction") +
        generateSliders("PL",  ["R","G","B"], 0,    1,   "Point light color",       [1,1,1])+
        generateSliders("PL",  ["X","Y","Z"], -10,  10,  "Point light position",    [6.8, 10, 9]) +
        generateSliders("CL",  ["R","G","B"], 0,    1,   "Cone light color") +
        generateSliders("CL",  ["X","Y","Z"], -10,  10,  "Cone light position",     [-8.47, 10, 9]) +
        generateSliders("CLD", ["X","Y","Z"], -180, 180, "Cone light direction",    [-48, -20, 0])
    )
}