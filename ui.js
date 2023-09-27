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
        let update_func = `updateObjectTab('${obj.name}', true)`
        let content = `
            <p>Material</p>
            ${generateSliders("Specular",   ["Factor_"+obj.name], 0, 5, "Specular",   null,  update_func)}
            ${generateSliders("Reflection", ["Factor_"+obj.name], 0, 1, "Reflection", [0.1], update_func)}
            <hr>
            Number of vertices : ${obj.count}<div id="objects_details_${i}_matrix"></div>
            ${generateTransformSliders(obj.name, update_func)}
            <p>Model matrix :</p>
            ${generateMatrix(obj.name, `updateObjectTab('${obj.name}', false)`, obj.modelMatrix)}
        `
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
                engine.objects.setTransform(obj_name, ...getTransformSlidersValues(obj_name))
                engine.objects.setMaterial(obj_name, {
                    specularColor:    [1,1,1],
                    specularPower:    getValue("SpecularFactor_"+obj_name),
                    reflectionFactor: getValue("ReflectionFactor_"+obj_name),
                })
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


    engine.scene.setMaterial(getValue("SpecularFactor"), getValue("ReflectionFactor"))
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

function generateLightsTab(){
    getById("mainTab_Lights").innerHTML = (
        generateSliders("AL",  ["R","G","B"], 0,    1,   "Ambiant light color",         [0,0,0],         "updateLightsTab()") +
        generateSliders("DL",  ["R","G","B"], 0,    1,   "Directional light color",     [0,0,0],         "updateLightsTab()") +
        generateSliders("DL",  ["X","Y","Z"], -1,   1,   "Directional light direction", [0,0,0],         "updateLightsTab()") +
        generateSliders("PL",  ["R","G","B"], 0,    1,   "Point light color",           [1,1,1],         "updateLightsTab()") +
        generateSliders("PL",  ["X","Y","Z"], -10,  10,  "Point light position",        [6.8, 10, 9],    "updateLightsTab()") +
        generateSliders("CL",  ["R","G","B"], 0,    1,   "Cone light color",            [0.5, 0.5, 0.5], "updateLightsTab()") +
        generateSliders("CL",  ["X","Y","Z"], -10,  10,  "Cone light position",         [-8.47, 10, 9],  "updateLightsTab()") +
        generateSliders("CLD", ["X","Y","Z"], -180, 180, "Cone light direction",        [-48, -20, 0],   "updateLightsTab()")
    )
}
function updateLightsTab(){
    engine.scene.lights.setAmbient([getValue("ALR"), getValue("ALG"), getValue("ALB")])
    engine.scene.lights.setDirectional(
        [getValue("DLR"), getValue("DLG"), getValue("DLB")], 
        [getValue("DLX"), getValue("DLY"), getValue("DLZ")]
    )
    engine.scene.lights.setPoint(
        [getValue("PLR"), getValue("PLG"), getValue("PLB")], 
        [getValue("PLX"), getValue("PLY"), getValue("PLZ")]
    )
    engine.scene.lights.setCone(
        [getValue("CLR"),  getValue("CLG"),  getValue("CLB")], 
        [getValue("CLX"),  getValue("CLY"),  getValue("CLZ")], 
        [getValue("CLDX"), getValue("CLDY"), getValue("CLDZ")]
    )
}