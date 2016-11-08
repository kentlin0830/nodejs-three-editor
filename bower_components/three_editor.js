
var MONGODB = {
  initialize: function(aCallbackFunction) {
    MONGODB.internal.queryMongodb(["initial_values", "scene_elements"],
                                  ["get", "get"],
                                  MONGODB.internal.onGetAll,
                                  aCallbackFunction,
                                  null);
  },

  addItem: function(aScene, aName, aVector3) {
    MONGODB.internal.queryMongodb(["scene_elements"],
                                  ["add;"+aName+";"+aVector3.x+";"+aVector3.y+";"+aVector3.z],
                                  MONGODB.internal.onAdd,
                                  null,
                                  aScene);
  },

  setItem: function(aScene, aElement, aCurrentTarget) {
    var command = MONGODB.internal.preSetItem(aScene, aElement, aCurrentTarget);
    MONGODB.internal.queryMongodb(["scene_elements"],
                                  ["set;"+command.join(";")],
                                  MONGODB.internal.onSet,
                                  null,
                                  null);
  },

  // 因為全部的資料已經在執行initialize時從mongo_db讀到本地端且存放在iSceneItemMap中.
  // 因此讀取元素的資料只需要回傳iSceneItemMap中,相應的資料即可.
  getItem: function(aElement) {
    return MONGODB.internal.iSceneItemMap.get(aElement);
  },

  // 將元件從aScene,iSceneItemMap以及MongoDb中移除.
  removeItem: function(aScene, aElement) {
    var sceneItem = MONGODB.internal.preRemoveItem(aScene, aElement)
    MONGODB.internal.queryMongodb(["scene_elements"],
                                  ["delete;"+sceneItem._id],
                                  MONGODB.internal.onRemove,
                                  null,
                                  null);
  },


  internal: {
    iSceneItemMap: new Map(),

    preSetItem: function(aScene, aElement, aCurrentTarget) {
      // 取出sceneItem.
      var sceneItem = MONGODB.internal.getItemByTarget(aElement, aCurrentTarget);
      if (!sceneItem) {
        alert("Error: setItem() 無法找到包含屬性:"+aCurrentTarget.id+"的元件.");
        return;
      }

      // 取出新的值.
      var value = CONTROL_PANEL.translateTargetValue(aCurrentTarget);

      // 把新的值設定給它.
      sceneItem[aCurrentTarget.id] = value;

      // 當新的值是"元件種類變更"時,要重新建立元件.
      switch (aCurrentTarget.id) {
        case "elem_kinds_cmb":
        case "box_width":
        case "box_height":
        case "box_depth":
        case "cylinder_radiusTop":
        case "cylinder_radiusBottom":
        case "cylinder_height":
        case "sphere_radius":
        case "sphere_width":
        case "sphere_height":
          // 移除原先的元件.
          MONGODB.internal.preRemoveItem(aScene, aElement);

          // 把新的元件加到aScene以及iSceneItemMap中.
          var element = MONGODB.internal.addSceneElement(aScene, sceneItem);

          // 把新的元件指定給iSelectedObject.
          aScene.iSelectedObject = CONTROL_PANEL.setSelectElement(element);
          break;
      }
      return [sceneItem._id, aCurrentTarget.id, value];
    },
  
    // 將item從aScene,iSceneItemMap中移除.
    preRemoveItem: function(aScene, aElement) {
      // 取出sceneItem並且把該元件移出map.
      var sceneItem = MONGODB.internal.iSceneItemMap.get(aElement);
      MONGODB.internal.iSceneItemMap.delete(aElement);
      // 把元件移出aScene
      aScene.iScene.remove(aElement);
      return sceneItem;
    },

    // 透過AJAX跟server要mongo資料庫的值
    queryMongodb: function(aTableNames, aActions, aHandler, aCallbackFunction, aScene) {
      var request = new XMLHttpRequest();
      request.open("GET", "query_mongodb?tables=" + aTableNames + "&actions=" + aActions);
      request.send();      
      request.onreadystatechange = function() {
        // 伺服器請求完成
        if (request.readyState != 4) {
          return;
        }

        // 伺服器回應成功
        if (request.status != 200) {
          return;
        }

        var type = request.getResponseHeader("Content-Type");   // 取得回應類型
        // 判斷回應類型，這裡使用 JSON
        if (type.indexOf("application/json") !== 0) {               
          alert("Error: queryMongodb() 錯誤的回傳屬性:" + request.status);
          return;
        }
        var responses = JSON.parse(request.responseText);
        aHandler(aCallbackFunction, aTableNames, responses, aScene);
      }
    },

    // 將回傳資料轉換成更容易懂的模式再來呼叫aCallbackFunction().
    onGetAll: function(aCallbackFunction, aTableNames, aResponses, aScene) {
      // 它會把所有元件加到aScene以及iSceneItemMap中.
      aCallbackFunction(aResponses["initial_values"][0],
                        MONGODB.internal.onAddSceneElements,
                        aResponses["scene_elements"]);
    },
    
    // 將回傳資料加入,aScene以及iSceneItemMap中.
    onAdd: function(aCallbackFunction, aTableNames, aResponses, aScene) {
      // 把新的元件加到aScene以及iSceneItemMap中.
      var sceneElement = aResponses[aTableNames[0]];
      MONGODB.internal.addSceneElement(aScene, sceneElement);
    },

    // 將回傳資料轉換成更容易懂的模式再來呼叫aCallbackFunction().
    onSet: function(aCallbackFunction, aTableNames, aResponses, aScene) {
      if (!aResponses[aTableNames[0]].ok) {
        alert("Error: onRemoveSelectedElement() 無法從資料庫中移除元件:"+aSceneElement._id);
        return;
      }
    },

    // 將回傳資料轉換成更容易懂的模式再來呼叫aCallbackFunction().
    onRemove: function(aCallbackFunction, aTableNames, aResponses, aScene) {
      if (!aResponses[aTableNames[0]].ok) {
        alert("Error: onRemoveSelectedElement() 無法從資料庫中移除元件:"+aSceneElement._id);
        return;
      }
    },

    // 它會把新元件加到 aScene, iSceneItemMap 中,
    // 並且用這些新的值調整 CONTROL_PANEL 的 ComboBox 值.
    addSceneElement: function(aScene, aSceneItem) {
      var element;
      switch (aSceneItem.name) {
        case "Fog":            element = MONGODB.internal.setFog(aScene, aSceneItem);              break;
        case "AmbientLight":   element = MONGODB.internal.setAmbientLight(aScene, aSceneItem);     break;
        case "DirectionLight": element = MONGODB.internal.setDirectionLight(aScene, aSceneItem);   break;
        case "Camera":         element = MONGODB.internal.setCamera(aScene, aSceneItem);           break;
        case "Ground":         element = MONGODB.internal.setGround(aScene, aSceneItem);           break;
        case "Wind":           element = MONGODB.internal.setWind(aScene, aSceneItem);              break;
        case "Geometry":       element = MONGODB.internal.addGeometry(aScene, aSceneItem);         break;
        default:               alert("Error: addSceneaElement() 沒有支援這個種類:" + aSceneItem.name); return;
      }
      MONGODB.internal.iSceneItemMap.set(element, aSceneItem);
      if (CONTROL_PANEL != undefined) {
        CONTROL_PANEL.setControlPanel(aSceneItem);
      }
      return element;
    },

    // 它會把所有元件加到aScene以及iSceneItemMap中.
    onAddSceneElements: function(aScene, aSceneItems) {
      MONGODB.internal.iSceneItemMap.clear();
      for (var i=0; i<aSceneItems.length; ++i) {
        MONGODB.internal.addSceneElement(aScene, aSceneItems[i]);
      }
    },

    setFog: function(aScene, aValues) {
      var fog = new THREE.Fog(aValues.fog_color, aValues.fog_near,aValues.fog_far);
      aScene.iFog = fog;

      if (aValues.fog_cmb == "fog_has") {
        aScene.iScene.fog = fog;
      }
      return fog;
    },

    setAmbientLight: function(aScene, aValues) {
      var light = new THREE.AmbientLight(parseInt(aValues.light_color));
      aScene.iAmbientLight = light;

      if (aValues.light_cmb == "light_has") {
        aScene.iScene.add(light);
      }
      return light;
    },

    setDirectionLight: function(aScene, aValues) {
      var light = new THREE.DirectionalLight(parseInt(aValues.lightd_color),
                                             parseInt(aValues.lightd_intensity));
      light.position.set(aValues.lightd_position_x,
                         aValues.lightd_position_y,
                         aValues.lightd_position_z );
      light.position.multiplyScalar( 1.3 );
      light.castShadow = true;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;
      var d = 300;
      light.shadow.camera.left = - d;
      light.shadow.camera.right = d;
      light.shadow.camera.top = d;
      light.shadow.camera.bottom = - d;
      light.shadow.camera.far = 1000;
      aScene.iDirectionLight = light;

      if (aValues.light_direction_cmb == "lightd_has") {
        aScene.iScene.add(light);
      }
      return light;
    },

    setCamera: function(aScene, aValues) {
      var camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.x = aValues.camerae_position_x;
      camera.position.y = aValues.camerae_position_y;
      camera.position.z = aValues.camerae_position_z;
      aScene.iCameraEdit = camera;
 
      var camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.x = aValues.camerap_position_x;
      camera.position.y = aValues.camerap_position_y;
      camera.position.z = aValues.camerap_position_z;
      aScene.iCameraPlay = camera;

      if (aValues.camera_cmb == "camera_edit") {
        aScene.iCamera = aScene.iCameraEdit;
      } else {
        aScene.iCamera = aScene.iCameraPlay;
      }
      aScene.iScene.add( aScene.iCamera );
      return camera;
    },

    setGround: function(aScene, aValues) {
      var loader = new THREE.TextureLoader();
      var groundTexture = loader.load( 'bower_components/three/textures/terrain/grasslight-big.jpg' );
      groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
      groundTexture.repeat.set( 25, 25 );
      groundTexture.anisotropy = 16;
      var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(20000, 20000),
                                new THREE.MeshPhongMaterial({ color:    parseInt(aValues.ground_color),
                                                              specular: parseInt(aValues.ground_specular),
                                                              map:      groundTexture }));
      mesh.position.x = aValues.ground_position_x;
      mesh.position.y = aValues.ground_position_y;
      mesh.position.z = aValues.ground_position_z;
      mesh.rotation.x = aValues.ground_rotation_x;
      mesh.rotation.y = aValues.ground_rotation_y;
      mesh.rotation.z = aValues.ground_rotation_z;
      mesh.receiveShadow = true;
      aScene.iGround = mesh;

      if (aValues.ground_cmb == "ground_has") {
        aScene.iScene.add(mesh);
      }
      return mesh;
    },
  
    setWind: function(aScene, aValues) {
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshPhongMaterial());
      aScene.iWind = mesh;
      aScene.iWindHas = false;
      if (aValues.wind_cmb == "wind_has") {
        aScene.iScene.add(mesh);
        aScene.iWindHas = true;
      }
      return mesh;
    },
  
    addGeometry: function(aScene, aValues) {
      var geometry;
      switch (aValues.elem_kinds_cmb) {
        case "elem_kind_box":
          geometry = new THREE.BoxGeometry(aValues.box_width, aValues.box_height, aValues.box_depth);
          break;
        case "elem_kind_cylinder":
          geometry = new THREE.CylinderGeometry(aValues.cylinder_radiusTop, aValues.cylinder_radiusBottom, aValues.cylinder_height);
          break;
        case "elem_kind_sphere":
          geometry = new THREE.SphereGeometry(aValues.sphere_radius, aValues.sphere_width, aValues.sphere_height);
          break;
        default:
          alert("Error: addGeometry() 沒有支援這個種類:" + aMode);
          return;
      }
      var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial(
                                            { color:     parseInt(aValues.elem_color),
                                              specular:  parseInt(aValues.elem_specular),
                                              shininess: aValues.elem_shininess }));
      mesh.position.x = aValues.elem_position_x;
      mesh.position.y = aValues.elem_position_y;
      mesh.position.z = aValues.elem_position_z;
      mesh.rotation.x = aValues.elem_rotation_x;
      mesh.rotation.y = aValues.elem_rotation_y;
      mesh.rotation.z = aValues.elem_rotation_z;
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      aScene.iScene.add( mesh );
      return mesh;
    },

    getItemByTarget: function(aElement, aCurrentTarget) {
      var sceneItem;
      for (let item of MONGODB.internal.iSceneItemMap.values()) {
        if (item[aCurrentTarget.id] === undefined) {
          continue;
        }
        switch (item.name) {
          case "Geometry":
            if (aElement == null) {
              return;
            }
            sceneItem = MONGODB.internal.iSceneItemMap.get(aElement);
            break; 
          default:
            sceneItem = item;
            break;
        }
        break;
      }
      return sceneItem;
    },
    
  }
};

var SCENE = {
  initialize: function(aContainer, aVertexShader, aFragmentShader) {
    if (!Detector.webgl) Detector.addGetWebGLMessage();

    // 設定3D場景所使用的HTML區塊,它們可以協助我們去取得正確的mouse座標
    SCENE.internal.iMainElement = document.getElementById('main');
    SCENE.internal.iContainer = aContainer;
    // 指定 Shader 的處理函式.
    SCENE.internal.iVertexShader = aVertexShader;
    SCENE.internal.iFragmentShader = aFragmentShader;

    // 從server端讀取mongo資料庫中的initial_values table資料.
    MONGODB.initialize(SCENE.internal.onInitializeScene);
  },

  runAnimate: function() {
    requestAnimationFrame( SCENE.runAnimate );
    var time = Date.now();

    windStrength = Math.cos( time / 7000 ) * 20 + 40;
    windForce.set( Math.sin( time / 2000 ), Math.cos( time / 3000 ), Math.sin( time / 1000 ) ).normalize().multiplyScalar( windStrength );

    SCENE.internal.render();
    SCENE.internal.iStats.update();
  },

  updateSceneValues: function(aCurrentTarget) {
    // 這裡要把更新後的值寫回database
    MONGODB.setItem(SCENE, SCENE.iSelectedObject, aCurrentTarget);

    switch (aCurrentTarget.id) {
      case "camera_cmb":
        SCENE.iScene.remove( SCENE.iCamera );
        if (aCurrentTarget.value == "camera_edit") {
          SCENE.iCamera = SCENE.iCameraEdit;
        } else {
          SCENE.iCamera = SCENE.iCameraPlay;
        }
        SCENE.iScene.add( SCENE.iCamera );
        break;
      case "light_cmb":
        if (aCurrentTarget.value == "light_has") {
          SCENE.iScene.add( SCENE.iAmbientLight );
        } else {
          SCENE.iScene.remove( SCENE.iAmbientLight );
        }
        break;
      case "light_direction_cmb":
        if (aCurrentTarget.value == "lightd_has") {
          SCENE.iScene.add( SCENE.iDirectionLight );
        } else {
          SCENE.iScene.remove( SCENE.iDirectionLight );
        }
        break;
      case "wind_cmb":
        if (aCurrentTarget.value == "wind_has") {
          SCENE.iScene.add( SCENE.iWind );
          SCENE.iWindHas = true;
        } else {
          SCENE.iScene.remove( SCENE.iWind );
          SCENE.iWindHas = false;
        }
        break;
      case "fog_cmb":
        if (aCurrentTarget.value == "fog_has") {
          SCENE.iScene.fog = SCENE.iFog;
        } else {
          SCENE.iScene.fog = null;
        }
        break;
      case "ground_cmb":
        if (aCurrentTarget.value == "ground_has") {
          SCENE.iScene.add( SCENE.iGround );
        } else {
          SCENE.iScene.remove( SCENE.iGround );
        }
        break;
      default:
        return false;
    }
    return true;
  },

  removeSelectedElement: function() {
    if (SCENE.iSelectedObject == null) {
      return;
    }
    MONGODB.removeItem(SCENE, SCENE.iSelectedObject);
    SCENE.iSelectedObject = null;
  },

  // 場景物件(也提供給外部使用)
  iScene: null,
  iCamera: null,
  iCameraEdit: null,
  iCameraPlay: null,
  iAmbientLight: null,
  iDirectionLight: null,
  iFog: null,
  iGround: null,
  iWind: null,
  iWindHas: false,

  // 放置目前focus的元件.
  iSelectedObject: null,

  internal: {
    // 指向HTML元件
    iMainElement: null,
    iContainer: null,
    iVertexShader: null,
    iFragmentShader: null,


    // 場景物件
    iStats: null,
    iRenderer: null,

    // 允許拖曳其他元件進入當前元件的功能.
    allowDropHandler: function(aEvent){
      aEvent.preventDefault();
    },

    // 當有元件被拖曳進來時,會使用這個函式進行處理.
    dropHandler: function(aEvent) {
      //設置Raycaster，setFromCamera(對renderer來說的x,y位置:-1~1, -1~1，Camera物件)
      var raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(SCENE.internal.getMouseVector2(aEvent).clone(), SCENE.iCamera);

      //設置position為，從camera到達螢幕投影中相對mouse點擊位置的3d位置.
      var vector3 = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().setLength(SCENE.iCamera.position.z));

      MONGODB.addItem(SCENE, aEvent.dataTransfer.getData("name"), vector3);
    },

    clickHandler: function(aEvent) {
      //設置Raycaster，setFromCamera(對renderer來說的x,y位置:-1~1, -1~1，Camera物件)
      var raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(SCENE.internal.getMouseVector2(aEvent).clone(), SCENE.iCamera);

      //將Scene的children(即各物件)和raycaster一起計算，得到滑鼠選中的Object(ray會貫穿，不只一個)
      var intersects = raycaster.intersectObjects(SCENE.iScene.children, true);
      if (!!intersects[0]) {
        SCENE.iSelectedObject = CONTROL_PANEL.setSelectElement(intersects[0].object);
      }
    },

    setContainer: function(aClients) {
      SCENE.internal.iContainer.addEventListener("dragover", SCENE.internal.allowDropHandler, false);
      SCENE.internal.iContainer.addEventListener("drop",     SCENE.internal.dropHandler,      false);
      SCENE.internal.iContainer.addEventListener("click",    SCENE.internal.clickHandler,     false);

      aClients.forEach(function(object) {
        SCENE.internal.iContainer.appendChild(object);
      });
    },

    // 3D場景的設定是有個偏移值的(放置控制列),因此所有的滑鼠event都需要進行修正才會是正確的值.
    getMouseVector2: function(aEvent) {
      if (aEvent === undefined || SCENE.internal.iMainElement == null || SCENE.internal.iContainer == null) {
        return new THREE.Vector2();
      }

      // 取得正確的mouse座標,因為3D場景所使用的區塊並非是最左上角.
      var pointX = aEvent.clientX - SCENE.internal.iMainElement.offsetLeft;
      var pointY = aEvent.clientY - SCENE.internal.iMainElement.offsetTop;

      // 將滑鼠的x、y位置換算成-1~1的值，從renderer的畫面左下角(-1,-1)，到右上解(1,1)
      var mouse = new THREE.Vector2();
      mouse.x = ((pointX + SCENE.internal.iContainer.offsetLeft + document.body.scrollLeft) / SCENE.internal.iContainer.offsetWidth) * 2 - 1;
      mouse.y = -((pointY + SCENE.internal.iContainer.offsetTop + document.body.scrollTop) / SCENE.internal.iContainer.offsetHeight) * 2 + 1;
      return mouse;
    },

    onInitializeScene: function(aInitialValues, aAddElementsCallback, aSceneItems) {

      // set all of combo-box values
      CONTROL_PANEL.setComboboxValues(aInitialValues);

      // scene
      SCENE.iScene = new THREE.Scene();

      // add all of elements
      aAddElementsCallback(SCENE, aSceneItems);

      // renderer
      SCENE.internal.setRenderer();

      // performance monitor
      SCENE.internal.iStats = new Stats();

      // 設定container物件,把需要的client以及需要增加的event都集合到同個函式處理.
      SCENE.internal.setContainer([SCENE.internal.iRenderer.domElement,
                                   SCENE.internal.iStats.dom]);

      window.addEventListener( 'resize', SCENE.internal.onWindowResize, false );
    },

    setRenderer: function() {
      // renderer
      var renderer = new THREE.WebGLRenderer( { antialias: true } );
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );
      renderer.setClearColor( SCENE.iFog.color );
      renderer.gammaInput = true;
      renderer.gammaOutput = true;
      renderer.shadowMap.enabled = true;

      // controls
      var controls = new THREE.OrbitControls( SCENE.iCameraEdit, renderer.domElement );
      controls.maxPolarAngle = Math.PI * 0.5;
      controls.minDistance = 1000;
      controls.maxDistance = 7500;

      SCENE.internal.iRenderer = renderer;
    },

    onWindowResize: function() {
      SCENE.iCamera.aspect = window.innerWidth / window.innerHeight;
      SCENE.iCamera.updateProjectionMatrix();
      SCENE.internal.iRenderer.setSize( window.innerWidth, window.innerHeight );
    },

    render: function() {
      SCENE.iCamera.lookAt( SCENE.iScene.position );
      SCENE.internal.iRenderer.render( SCENE.iScene, SCENE.iCamera );
    }
  }
};
