
var CONTROL_PANEL = {
  // 轉換Target的值,成為正確的值.
  translateTargetValue(aCurrentTarget) {
    var value;
    if (aCurrentTarget.id.indexOf("_color") == aCurrentTarget.id.length - 6 ||
        aCurrentTarget.id.indexOf("_specular") == aCurrentTarget.id.length - 9) {
      value = parseInt(aCurrentTarget.value, 16);
    } else if (aCurrentTarget.id.indexOf("_cmb") == aCurrentTarget.id.length - 4) {
      value = aCurrentTarget.value;
    } else {
      value = parseFloat(aCurrentTarget.value);
    }
    return value;
  },

  // 提供拖曳的功能,讓使用者可以從控制列表中,把想要新增的元件拖曳到場景中.
  onDrag: function(aEvent) {
    aEvent.dataTransfer.setData("name", aEvent.currentTarget.name);
  },

  // 提供輸入欄位回呼的函式,會將新輸入的值指定給3D場景或場景中的元件.
  onChanged: function(aEvent) {
    var lastValue = CONTROL_PANEL.internal.iLastComboboxValues[aEvent.currentTarget.id];
    if (lastValue !== undefined) {
      if (aEvent.currentTarget.value === undefined || aEvent.currentTarget.value == lastValue) {
        alert("Error: onChanged() 錯誤的傳入參數:" + aEvent.currentTarget.value);
        return;
      }
      document.getElementById(lastValue).style = "display:none";
      document.getElementById(aEvent.currentTarget.value).style = "display:block";
      CONTROL_PANEL.internal.iLastComboboxValues[aEvent.currentTarget.id] = aEvent.currentTarget.value;
    }

    if (!SCENE) {
      return;
    }

    if (SCENE.iSelectedObject != null && aEvent.currentTarget.id == "elem_color") {
      // 因為這裡是設定元件的顏色值,但又因為為了區分所選定的元件(選定的元件色彩為固定值).
      // 這邊的作法是保持看到的元件色彩,但是當元件不再被選擇時,會顯示新的顏色.
      CONTROL_PANEL.internal.iSelectedObjects.set(SCENE.iSelectedObject, parseInt(aEvent.currentTarget.value, 16));
    }

    // 更新選單個3D物件的屬性值.
    var finished = SCENE.updateSceneValues(aEvent.currentTarget);
    if (aEvent.currentTarget.id != "elem_color") {
      CONTROL_PANEL.internal.updateValues(aEvent.currentTarget);
    }
  },

  // 定義控制元件List的click函式
  // 讓控制列表的細項可以自由的關閉開啟.
  onClickControl: function(aEvent) {
    // 想要顯示的元件是"attributes"時,要進行特殊的處理,因為它被使用的先決條件是必須有物件被選擇.
    if (aEvent.currentTarget.name == "attributes" && SCENE && SCENE.iSelectedObject == null) {
      alert("Error: switchControlItem() 屬性資料只有在有3D元件被選擇時才能使用.");
      return;
    }

    // 切換控制列表的細項,讓它由 開->關 or 關->開.
    CONTROL_PANEL.internal.switchControlItem(aEvent.currentTarget.name);
  },

  onClickButton: function(aEvent) {
    switch (aEvent.currentTarget.id) {
      case "elem_remove":
        if (SCENE) {
          SCENE.removeSelectedElement();
        }
        CONTROL_PANEL.internal.releaseSelectdObjects();
        break;
      default:
        alert("Error: onClickButton() 沒有支援這個按鈕:"+aEvent.currentTarget.id);
        break;
    }
  },

  // 定義元件被選擇到的函式
  // 管理被選擇的物件,並且將物件變色以利使用者區別.
  setSelectElement: function(aSelectedElement) {
    if (!MONGODB) {
      // 如果mongo_db不存在時,不做任何動作.
      return null;
    }

    var sceneItem = MONGODB.getItem(aSelectedElement);
    if (!sceneItem || sceneItem.name != "Geometry") {
      // 如果選到的object不被支援時,不做任何動作.
      return null;
    }

    if (CONTROL_PANEL.internal.iSelectedObjects.has(aSelectedElement)) {
      // 如果iSelectedObjects中包含新選到的object,代表要取消選擇.
      // 還原object的顏色並且將它移出iSelectedObjects
      CONTROL_PANEL.internal.switchControlItem("attributes", false);
      CONTROL_PANEL.internal.releaseSelectdObjects(aSelectedElement);
      return null;
    }

    var isSelectGroup = false;
    if (!isSelectGroup) {
      // 如果不是群組模式,代表僅僅允許選擇一個object,所以需要在選擇前把其他objects還原並移出list.
      CONTROL_PANEL.internal.releaseSelectdObjects();
      CONTROL_PANEL.setControlPanel(sceneItem);
    }

    // 將object原來的顏色存進iSelectedObjects中，以object為key
    CONTROL_PANEL.internal.iSelectedObjects.set(aSelectedElement, aSelectedElement.material.color.getHex());
    CONTROL_PANEL.internal.switchControlItem("attributes", true);
    //改變Object的顏色
    aSelectedElement.material.color.setHex(0xff0000);
    return aSelectedElement;
  },

  setComboboxValues: function(aSceneItem) {
    for (var key in aSceneItem) {
      var index = key.indexOf("_cmb");
      if (index < 0 || index != key.length - 4) {
        continue;
      }

      var lastValue = CONTROL_PANEL.internal.iLastComboboxValues[key];
      if (lastValue && lastValue != aSceneItem[key]) {
        document.getElementById(lastValue).style = "display:none";
      }
      if (lastValue != aSceneItem[key]) {
        document.getElementById(aSceneItem[key]).style = "display:block";
      }

      CONTROL_PANEL.internal.iLastComboboxValues[key] = aSceneItem[key];
    }
  },

  // 設定控制面板上的值.
  setControlPanel: function(aSceneItem) {
    for (var key in aSceneItem) {
      var element = document.getElementById(key);
      if (element === undefined || element == null) {
        continue;
      }
      if (key.indexOf("color") >= 0 || key.indexOf("specular") >= 0) {
        element.value = (0x1000000+parseInt(aSceneItem[key])).toString(16).substring(1);
      } else {
        element.value = aSceneItem[key];
      }
    }
    CONTROL_PANEL.setComboboxValues(aSceneItem);
    return true;
  },

  internal: {
    // 存放控制元件的細項顯示狀態,讓本物件可以依據這項清單進行關閉開啟的動作.
    iControlDetails: [],

    // 在object被變顏色之前，會先把object和原來的顏色存到這個Map，
    // Key是object、Value是原來的顏色
    iSelectedObjects: new Map(),

    // 使用選擇到的元件來設定控制單元的值.
    iLastComboboxValues: new Object(),

    switchControlItem: function(aId, aDisplay) {
      // 如果未定義是否顯示,則代表進行開關切換(即: 開->關 or 關->開).
      if (aDisplay === undefined) {
        if (CONTROL_PANEL.internal.iControlDetails[aId] === undefined ||
            CONTROL_PANEL.internal.iControlDetails[aId] == false) {
          aDisplay = true;
        } else {
          aDisplay = false;
        }
      }

      // 取得欲設定的元件,以便於對它進行設定.
      var element = document.getElementById(aId);
      if (element === undefined || element == null) {
        alert("Error: switchControlItem() 無法取得屬性物件 id:" + aId);
        return;
      }

      // 實際更新元件的屬性,讓這些子元件顯示或隱藏.
      if (aDisplay) {
        CONTROL_PANEL.internal.iControlDetails[aId] = true;
        element.style = "display:block";
      } else {
        CONTROL_PANEL.internal.iControlDetails[aId] = false;
        element.style = "display:none";
      }
    },

    // 使用database定義中預設的物件來進行更新.
    updateValues: function(aCurrentTarget) {
      if (!aCurrentTarget.name) {
        return false;
      }

      var objects = aCurrentTarget.name.split(".");
      if (objects.length < 2) {
        return false;
      }

      var element;
      switch (objects[0]) {
        case "SCENE":         element = SCENE;         break;
        case "CONTROL_PANEL": element = CONTROL_PANEL; break;
        default:              return false;
      }
      if (!element) {
        return false;
      }

      for (var i=1; i<objects.length-1; ++i) {
        element = element[objects[i]];
        if (!element) {
          return false;
        }
      }

      var value = CONTROL_PANEL.translateTargetValue(aCurrentTarget);
      if (objects[objects.length-1] == "color" || objects[objects.length-1] == "specular") {
        element[objects[objects.length-1]].setHex(value);
      } else {
        element[objects[objects.length-1]] = value;
      }
      return true;
    },

    // 遍歷iSelectedObjects中的objects,以移除特定object或是全部的objects.
    releaseSelectdObjects: function(aObject) {
      if (aObject !== undefined) {
        // 如果iSelectedObjects中包含新選到的object,代表要取消選擇.
        // 還原object的顏色並且將它移出iSelectedObjects
        if (CONTROL_PANEL.internal.iSelectedObjects.has(aObject)) {
          aObject.material.color.setHex(CONTROL_PANEL.internal.iSelectedObjects.get(aObject));
          CONTROL_PANEL.internal.iSelectedObjects.delete(aObject);
          return true;
        }
        return false;
      } else {
        // 把object的顏色(原來的顏色存在以object為key的value中)改回來
        // 將所有iSelectedObjects中的資料還原並且刪除
        for (let key of CONTROL_PANEL.internal.iSelectedObjects.keys()) {
          key.material.color.setHex(CONTROL_PANEL.internal.iSelectedObjects.get(key));
        }
        CONTROL_PANEL.internal.iSelectedObjects.clear();
      }
      return true;
    },
  }
};
