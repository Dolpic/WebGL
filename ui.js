import Slider, {SliderGroup} from "./js/ui/slider.js"

export default class UI {
    static generateShadersTab(){
        let programs = engine.scene.programs.programs
        let content = "<p>Dynamically generated shaders</p><hr>"
        for(let shader_name in programs){
            content += `
                <p>${shader_name}</p>
                <span>Vertex</span>
                <textarea readonly>${programs[shader_name].shaders.getVertex()}</textarea>
                <span>Fragment</span>
                <textarea readonly>${programs[shader_name].shaders.getFragment()}</textarea>
                <hr>`
        }
        getById("mainTab_Shaders").innerHTML = content
    }
    
    static generateObjectsTab(objs){
        let names_content = []
        Object.values(objs).forEach( (obj, i) => {
            let content = `
                <p>Material</p>
                <div id="${obj.name}_material"></div>
                <hr>
                Number of vertices : ${obj.count}<div id="objects_details_${i}_matrix"></div>
                <div id="${obj.name}_transform_sliders"></div>
                <p>Model matrix :</p>
                ${generateMatrix(obj.name, `updateObjectTab('${obj.name}')`, obj.modelMatrix)}
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

        Object.values(objs).forEach(obj => {
            new Slider(obj.name+"_material", "Reflectionfactor", 0.1, val=>engine.objects.updateMaterial(obj.name, {reflectionFactor:val}), 0, 1)
            new Slider(obj.name+"_material", "Specular",         2,   val=>engine.objects.updateMaterial(obj.name, {specularPower:val}),    0, 5)
            
            UI.generateTransformSliders(obj.name+"_transform_sliders", val=>engine.objects.setTransform(obj.name, val.position, val.rotation, val.scale))
        })
    }
    
    static generateViewTab(engine){
        getById("mainTab_View").innerHTML = "<p>View matrix : </p><div id='view_sliders'></div>"+generateMatrix("view", `updateViewTab(false)`, engine.getViewProjection().view)
        UI.generateTransformSliders("view_sliders", vals=>{
            engine.scene.camera.setView(vals.position,vals.rotation,vals.scale)
            setMatrixValues("view", engine.scene.camera.getState().view)
        }, [[0,0,-26],[-71,0,-120],[1,1,1]]) 
    }
    
    static generateLightsTab(){
        getById("mainTab_Lights").innerHTML = `
            <p>Ambient light</p><div id="ambient_light"></div>
            <hr>
            <p>Directional light</p>
            <div id="dir_light">
                <span>Color</span><div id="dir_light_color"></div>
                <span>Direction</span><div id="dir_light_direction"></div>
            </div>
            <hr>
            <p>Point light</p>
            <div id="point_light">
                <span>Color</span><div id="point_light_color"></div>
                <span>Position</span><div id="point_light_position"></div>
            </div>
            <hr>
            <p>Cone light</p>
            <div id="cone_light">
                <span>Color</span><div id="cone_light_color"></div>
                <span>Position</span><div id="cone_light_position"></div>
                <span>Direction</span><div id="cone_light_direction"></div>
            </div>
        `
        new SliderGroup("ambient_light",        ["R","G","B"], [0,0,0],         vals=>engine.scene.lights.setAmbient(vals),             0, 1)
        new SliderGroup("dir_light_color",      ["R","G","B"], [0,0,0],         vals=>engine.scene.lights.setDirectional(vals),         0, 1)
        new SliderGroup("dir_light_direction",  ["X","Y","Z"], [0,0,0],         vals=>engine.scene.lights.setDirectional(null, vals),  -1, 1)
        new SliderGroup("point_light_color",    ["R","G","B"], [1,1,1],         vals=>engine.scene.lights.setPoint(vals),               0, 1)
        new SliderGroup("point_light_position", ["X","Y","Z"], [6.8, 10, 9],    vals=>engine.scene.lights.setPoint(null, vals),       -10, 10)
        new SliderGroup("cone_light_color",     ["R","G","B"], [0.5, 0.5, 0.5], vals=>engine.scene.lights.setCone(vals),                0, 1)
        new SliderGroup("cone_light_position",  ["X","Y","Z"], [-8.5, 10, 9],   vals=>engine.scene.lights.setCone(null, vals),        -10, 10)
        new SliderGroup("cone_light_direction", ["X","Y","Z"], [-48, -20, 0],   vals=>engine.scene.lights.setCone(null, null, vals), -180, 180)
    }

    static generateTransformSliders(id, oninputs, values=[[0,0,0],[0,0,0],[1,1,1]]){
        document.getElementById(id).innerHTML = `
            <p>Position</p><div id="${id}_pos_sliders">  </div>
            <p>Rotation</p><div id="${id}_rot_sliders">  </div>
            <p>Scale</p>   <div id="${id}_scale_sliders"></div>
        `
        function getState(){
            function value(slider){return document.getElementById(id+slider).value}
            return {
                position:[value("_pos_sliders_X_input"),  value("_pos_sliders_Y_input"),  value("_pos_sliders_Z_input")],
                rotation:[value("_rot_sliders_X_input"),  value("_rot_sliders_Y_input"),  value("_rot_sliders_Z_input")],
                scale:   [value("_scale_sliders_X_input"),value("_scale_sliders_Y_input"),value("_scale_sliders_Z_input")]
            }
        }
        new SliderGroup(id+"_pos_sliders",   ["X","Y","Z"], values[0], ()=>oninputs(getState()), -50, 50, 0.001, false)
        new SliderGroup(id+"_rot_sliders",   ["X","Y","Z"], values[1], ()=>oninputs(getState()), -180, 180, 0.001, false)
        new SliderGroup(id+"_scale_sliders", ["X","Y","Z"], values[2], ()=>oninputs(getState()), 0.001, 5, 0.001, false)
        oninputs(getState())
    }
}
