const monk = require('monk');
const wrap = require('co-monk');

const defaultControls = [
  { id:   "scene",
    name: "場景屬性",
    items: [{ id: "camera_cmb", name: "攝影機", type: "combobox", size: 3,
              sub: [{ id: "camera_edit", name: "編輯用", items:
                      [{ id: "camerae_position_x", name: "位址-X:", type: "text-number", size: 3, object: "SCENE.iCameraEdit.position.x" },
                       { id: "camerae_position_y", name: "位址-Y:", type: "text-number", size: 3, object: "SCENE.iCameraEdit.position.y" },
                       { id: "camerae_position_z", name: "位址-Z:", type: "text-number", size: 3, object: "SCENE.iCameraEdit.position.z" }]},
                    { id: "camera_play", name: "播放用", items:
                      [{ id: "camerap_position_x", name: "位址-X:", type: "text-number", size: 3, object: "SCENE.iCameraPlay.position.x" },
                       { id: "camerap_position_y", name: "位址-Y:", type: "text-number", size: 3, object: "SCENE.iCameraPlay.position.y" },
                       { id: "camerap_position_z", name: "位址-Z:", type: "text-number", size: 3, object: "SCENE.iCameraPlay.position.z" }]}]},
            { id: "light_cmb", name: "環境光源:", type: "combobox", size: 3,
              sub: [{ id: "light_none", name: "無", items: [] },
                    { id: "light_has",  name: "有", items:
                      [{ id: "light_color", name: "色彩:", type: "text-number-hex", size: 6, object: "SCENE.iAmbientLight.color" }]}]},
            { id: "light_direction_cmb", name: "指向性光源:", type: "combobox", size: 3,
              sub: [{ id: "lightd_none", name: "無", items: [] },
                    { id: "lightd_has",  name: "有", items:
                      [{ id: "lightd_position_x",    name: "位址-X:", type: "text-number",     size: 3, object: "SCENE.iDirectionLight.position.x" },
                       { id: "lightd_position_y",    name: "位址-Y:", type: "text-number",     size: 3, object: "SCENE.iDirectionLight.position.y" },
                       { id: "lightd_position_z",    name: "位址-Z:", type: "text-number",     size: 3, object: "SCENE.iDirectionLight.position.z" },
                       { id: "lightd_color",         name: "顏色:",   type: "text-number-hex", size: 6, object: "SCENE.iDirectionLight.color"      },
                       { id: "lightd_intensity",     name: "強度:",   type: "text-float",      size: 3, object: "SCENE.iDirectionLight.intensity"  }]}]},
            { id: "wind_cmb", name: "風", type: "combobox", size: 3,
              sub: [{ id: "wind_none", name: "無", items: [] },
                    { id: "wind_has",  name: "有", items: [] }]},
            { id: "fog_cmb", name: "霧", type: "combobox", size: 3,
              sub: [{ id: "fog_none", name: "無", items: [] },
                    { id: "fog_has",  name: "有", items:
                      [{ id: "fog_color", name: "顏色:", type: "text-number-hex", size: 6, object: "SCENE.iFog.color" },
                       { id: "fog_near",  name: "近:",   type: "text-number",     size: 3, object: "SCENE.iFog.near"  },
                       { id: "fog_far",   name: "遠:",   type: "text-number",     size: 3, object: "SCENE.iFog.far"   }]}]},
            { id: "ground_cmb", name: "地板", type: "combobox", size: 3,
              sub: [{ id: "ground_none", name: "無", items: [] },
                    { id: "ground_has",  name: "有", items:
                      [{ id: "ground_position_x",        name: "位址-X:", type: "text-number",     size: 3, object: "SCENE.iGround.position.x" },
                       { id: "ground_position_y",        name: "位址-Y:", type: "text-number",     size: 3, object: "SCENE.iGround.position.y" },
                       { id: "ground_position_z",        name: "位址-Z:", type: "text-number",     size: 3, object: "SCENE.iGround.position.z" },
                       { id: "ground_rotation_x",        name: "旋轉-X:", type: "text-number",     size: 3, object: "SCENE.iGround.rotation.x" },
                       { id: "ground_rotation_y",        name: "旋轉-Y:", type: "text-number",     size: 3, object: "SCENE.iGround.rotation.y" },
                       { id: "ground_rotation_z",        name: "旋轉-Z:", type: "text-number",     size: 3, object: "SCENE.iGround.rotation.z" },
                       { id: "ground_color",             name: "顏色:",   type: "text-number-hex", size: 6, object: "SCENE.iGround.material.color" },
                       { id: "ground_specular",          name: "鏡面:",   type: "text-number-hex", size: 6, object: "SCENE.iGround.material.specular" }]
                   }]
           }]
  },
  { id:   "elements",
    name: "元件庫",
    items: [{ id: "box",      name: "elem_kind_box",      type: "image-box",      size: 30 },
            { id: "cylinder", name: "elem_kind_cylinder", type: "image-cylinder", size: 30 },
            { id: "sphere",   name: "elem_kind_sphere",   type: "image-sphere",   size: 30 }]
  },
  { id:   "attributes",
    name: "元件屬性",
    items: [{ id: "elem_remove",     name: "刪除元件", type: "button",           size: 3 },
            { id: "elem_position_x", name: "位址-X:", type: "text-number",      size: 3, object: "SCENE.iSelectedObject.position.x" },
            { id: "elem_position_y", name: "位址-Y:", type: "text-number",      size: 3, object: "SCENE.iSelectedObject.position.y" },
            { id: "elem_position_z", name: "位址-Z:", type: "text-number",      size: 3, object: "SCENE.iSelectedObject.position.z" },
            { id: "elem_rotation_x", name: "旋轉-X:", type: "text-number",      size: 3, object: "SCENE.iSelectedObject.rotation.x" },
            { id: "elem_rotation_y", name: "旋轉-Y:", type: "text-number",      size: 3, object: "SCENE.iSelectedObject.rotation.y" },
            { id: "elem_rotation_z", name: "旋轉-Z:", type: "text-number",      size: 3, object: "SCENE.iSelectedObject.rotation.z" },
            { id: "elem_color",      name: "顏色:",   type: "text-number-hex",  size: 6, object: "SCENE.iSelectedObject.material.color"      },
            { id: "elem_specular",   name: "鏡面:",   type: "text-number-hex",  size: 6, object: "SCENE.iSelectedObject.material.specular"   },
            { id: "elem_shininess",  name: "光澤:",   type: "text-number",      size: 3, object: "SCENE.iSelectedObject.material.shininess"  },
            { id: "elem_kinds_cmb",  name: "種類:",   type: "combobox",         size: 3,
              sub: [{ id: "elem_kind_box",      name: "四方體", items:
                      [{ id: "box_width",  name: "寬:", type: "text-number", size: 3, object: "SCENE.iSelectedObject.box_width" },
                       { id: "box_height", name: "高:", type: "text-number", size: 3, object: "SCENE.iSelectedObject.box_height" },
                       { id: "box_depth",  name: "深:", type: "text-number", size: 3, object: "SCENE.iSelectedObject.box_depth" }]},
                    { id: "elem_kind_cylinder", name: "圓柱體", items:
                      [{ id: "cylinder_radiusTop",    name: "半徑(頂):", type: "text-number", size: 3, object: "SCENE.iSelectedObject.cylinder_radiusTop" },
                       { id: "cylinder_radiusBottom", name: "半徑(底):", type: "text-number", size: 3, object: "SCENE.iSelectedObject.cylinder_radiusBottom" },
                       { id: "cylinder_height",       name: "高:",      type: "text-number", size: 3, object: "SCENE.iSelectedObject.cylinder_height" }]},
                    { id: "elem_kind_sphere", name: "球體", items:
                      [{ id: "sphere_radius", name: "半徑:", type: "text-number", size: 3, object: "SCENE.iSelectedObject.sphere_radius" },
                       { id: "sphere_width",  name: "寬:",   type: "text-number", size: 3, object: "SCENE.iSelectedObject.sphere_width"  },
                       { id: "sphere_height", name: "高:",   type: "text-number", size: 3, object: "SCENE.iSelectedObject.sphere_height" }]}]
            }]
  }
];

const defaultInitialValues = {
  camera_cmb: "camera_edit",
  camerae_position_x: 1000, camerae_position_y: 50, camerae_position_z: 1500,
  camerap_position_x: 0, camerap_position_y: 0, camerap_position_z: 0,
  light_cmb: "light_has", light_color: "666666",
  light_direction_cmb: "lightd_has",
  lightd_position_x: 50, lightd_position_y: 200, lightd_position_z: 100,
  lightd_color: "dfebff", lightd_intensity: 1.75,
  wind_cmb: "wind_has",
  fog_cmb: "fog_has",  fog_color: "cce0ff", fog_near: 500, fog_far: 10000,
  ground_cmb: "ground_has", ground_color: "ffffff", ground_specular: "ffffff",
  ground_position_x: 0, ground_position_y: -250, ground_position_z: 0,
  ground_rotation_x: -Math.PI/2, ground_rotation_y: 0, ground_rotation_z: 0,
  elem_position_x: 0, elem_position_y: 0, elem_position_z: 0,
  elem_rotation_x: 0, elem_rotation_y: 0, elem_rotation_z: 0,
  elem_color: "ffffff", elem_specular: "111111", elem_shininess: 100,
  elem_kinds_cmb: "elem_kind_box",
  box_width: 30, box_height: 50, box_depth: 10,
  cylinder_radiusTop: 15, cylinder_radiusBottom: 15, cylinder_height: 50,
  sphere_radius: 20, sphere_width: 20, sphere_height: 20,
};

const defaultSceneElements = [
  { name: "Fog",            fog_cmb: "fog_has", fog_color: 0xcce0ff, fog_near: 500, fog_far: 10000 },
  { name: "AmbientLight",   light_cmb: "light_has", light_color: 0x666666 },
  { name: "DirectionLight", light_direction_cmb: "lightd_has", lightd_position_x: 50, lightd_position_y: 200, lightd_position_z: 100, lightd_color: 0xdfebff, lightd_intensity: 1.75 },
  { name: "Camera",         camera_cmb: "camera_edit", camerae_position_x: 1000, camerae_position_y: 50, camerae_position_z: 1500,
                            camerap_position_x: 0, camerap_position_y: 0, camerap_position_z: 0 },
  { name: "Ground",         ground_cmb: "ground_has", ground_position_x: 0, ground_position_y: -250, ground_position_z: 0,
                            ground_rotation_x: -Math.PI/2, ground_rotation_y: 0, ground_rotation_z: 0, ground_color: 0xffffff, ground_specular: 0xffffff },
  { name: "Wind",           wind_cmb: "wind_has" },
  { name: "Geometry",       elem_kinds_cmb: "elem_kind_box", elem_position_x: -125, elem_position_y: -63, elem_position_z: 0,
                            elem_rotation_x: 0, elem_rotation_y: 0, elem_rotation_z: 0, elem_color: 0xffffff, elem_specular: 0x111111, elem_shininess: 100,
                            box_width: 5, box_height: 375, box_depth: 5,
                            cylinder_radiusTop: 15, cylinder_radiusBottom: 15, cylinder_height: 50,
                            sphere_radius: 20, sphere_width: 20, sphere_height: 20 },
  { name: "Geometry",       elem_kinds_cmb: "elem_kind_box", elem_position_x: 125, elem_position_y: -62, elem_position_z: 0,
                            elem_rotation_x: 0, elem_rotation_y: 0, elem_rotation_z: 0, elem_color: 0xffffff, elem_specular: 0x111111, elem_shininess: 100,
                            box_width: 5, box_height: 375, box_depth: 5,
                            cylinder_radiusTop: 15, cylinder_radiusBottom: 15, cylinder_height: 50,
                            sphere_radius: 20, sphere_width: 20, sphere_height: 20 },
  { name: "Geometry",       elem_kinds_cmb: "elem_kind_box", elem_position_x: 0, elem_position_y: -250+(750/2), elem_position_z: 0,
                            elem_rotation_x: 0, elem_rotation_y: 0, elem_rotation_z: 0, elem_color: 0xffffff, elem_specular: 0x111111, elem_shininess: 100,
                            box_width: 255, box_height: 5, box_depth: 5,
                            cylinder_radiusTop: 15, cylinder_radiusBottom: 15, cylinder_height: 50,
                            sphere_radius: 20, sphere_width: 20, sphere_height: 20 },
  { name: "Geometry",       elem_kinds_cmb: "elem_kind_box", elem_position_x: 125, elem_position_y: -250, elem_position_z: 0,
                            elem_rotation_x: 0, elem_rotation_y: 0, elem_rotation_z: 0, elem_color: 0xffffff, elem_specular: 0x111111, elem_shininess: 100,
                            box_width: 10, box_height: 10, box_depth: 10,
                            cylinder_radiusTop: 15, cylinder_radiusBottom: 15, cylinder_height: 50,
                            sphere_radius: 20, sphere_width: 20, sphere_height: 20 },
  { name: "Geometry",       elem_kinds_cmb: "elem_kind_box", elem_position_x: -125, elem_position_y: -250, elem_position_z: 0,
                            elem_rotation_x: 0, elem_rotation_y: 0, elem_rotation_z: 0, elem_color: 0xffffff, elem_specular: 0x111111, elem_shininess: 100,
                            box_width: 10, box_height: 10, box_depth: 10,
                            cylinder_radiusTop: 15, cylinder_radiusBottom: 15, cylinder_height: 50,
                            sphere_radius: 20, sphere_width: 20, sphere_height: 20 },
  { name: "Geometry",       elem_kinds_cmb: "elem_kind_sphere", elem_position_x: 0, elem_position_y: -45, elem_position_z: 0,
                            elem_rotation_x: 0, elem_rotation_y: 0, elem_rotation_z: 0, elem_color: 0xaaaaaa, elem_specular: 0x111111, elem_shininess: 100,
                            box_width: 60, box_height: 20, box_depth: 20,
                            cylinder_radiusTop: 15, cylinder_radiusBottom: 15, cylinder_height: 50,
                            sphere_radius: 60, sphere_width: 20, sphere_height: 20 },
];

var databases = [];
var initial_values = [defaultInitialValues];

function connect(aDatabaseTable) {
  if (databases[aDatabaseTable] === undefined) {
    var db = monk("localhost/three_editor");
    databases[aDatabaseTable] = wrap(db.get(aDatabaseTable));
  }
  return databases[aDatabaseTable];
}

function * find(aTable, aKey) {
  var database = connect(aTable);
  var results = yield database.find(aKey);
  if (results.length == 0 && JSON.stringify(aKey) === JSON.stringify({})) {
    results = yield installDefaultData(database, aTable);
  }
  return results;
}

function * installDefaultData(aDatabase, aTable) {
  var results = [];
  if (aTable == 'controls') {
    for (var i=0; i<defaultControls.length; ++i) {
      results[i] = yield aDatabase.insert(defaultControls[i]);
    }
  } else if (aTable == 'initial_values') {
    results[0] = yield aDatabase.insert(defaultInitialValues);
  } else if (aTable == 'scene_elements') {
    for (var i=0; i<defaultSceneElements.length; ++i) {
      results[i] = yield aDatabase.insert(defaultSceneElements[i]);
    }
  } else {
    throw new Error("Can't support this table:" + aTable);
  }
  return results;
}

exports.initialize = function * () {
  var controls       = yield find('controls', {});
  var scene_elements = yield find('scene_elements', {});
  initial_values     = yield find('initial_values', {});
  return { controls: controls, initial_values: initial_values, scene_elements: scene_elements };
};

exports.get = function * (aTable, aKey) {
  if (aKey === undefined) {
    return yield find(aTable, {});
  }
  return yield find(aTable, aKey);
};

exports.set = function * (aTable, aParameters) {
  const database = connect(aTable);
  var updateItems = new Object();
  for (var i=1; i<aParameters.length; i+=2) {
    updateItems[aParameters[i]] = aParameters[i+1];
  }
  return yield database.update({ _id: aParameters[0] }, { $set: updateItems });
};

exports.add = function * (aTable, aParameters) {
  const database = connect(aTable);
  const initialValues = initial_values[0];
  var parameters = { name: "Geometry",
                     elem_kinds_cmb:  aParameters[0],
                     elem_position_x: parseFloat(aParameters[1]),
                     elem_position_y: parseFloat(aParameters[2]),
                     elem_position_z: parseFloat(aParameters[3]),
                     elem_rotation_x: initialValues.elem_rotation_x,
                     elem_rotation_y: initialValues.elem_rotation_y,
                     elem_rotation_z: initialValues.elem_rotation_z,
                     elem_color:      parseInt(initialValues.elem_color, 16),
                     elem_specular:   parseInt(initialValues.elem_specular, 16),
                     elem_shininess:  initialValues.elem_shininess,
                     box_width:       initialValues.box_width,
                     box_height:      initialValues.box_height,
                     box_depth:       initialValues.box_depth,
                     cylinder_radiusTop:    initialValues.cylinder_radiusTop,
                     cylinder_radiusBottom: initialValues.cylinder_radiusBottom,
                     cylinder_height:       initialValues.cylinder_height,
                     sphere_radius:         initialValues.sphere_radius,
                     sphere_width:          initialValues.sphere_width,
                     sphere_height:         initialValues.sphere_height };
  return yield database.insert(parameters);
};

exports.delete = function * (aTable, aParameters) {
  const database = connect(aTable);
  return yield database.remove({ _id: aParameters[0] });
};
