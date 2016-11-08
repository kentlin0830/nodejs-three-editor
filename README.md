Three-Editor

========

#### JavaScript 3D editor ####

It's a simple editor for 3D scene. (base on Node.js - Koa)
You can drog new element into 3D scene and you also can update their attribute.
The editor will save all of your changes into MongoDb.

這是一個簡易的3D編輯器,它讓使用者可以拖曳新的3D元件到3D場景中.
當然使用者也可以用它來改變已經存在在3D場景中的物件.
所有使用者進行的修改都會被存入Mongo資料庫中.

所有有關3D繪圖的部分都是使用three.js的函式,這些函式都放在bower_components/three路徑下.
(細節可以參考本專案的bower_components/three/README.md或是[Reference]https://github.com/mrdoob/three.js/)


### Usage ###

// Download all of source code from this project.
[Download]https://github.com/kentlin0830/nodejs-three-editor

// install mongo database in your PC
```text
$ sudo apt-get install mongodb
$ sudo service mongodb restart
```

// start to use this editor.
```text
$ cd nodejs-three-editor
$ npm install
$ node app.js
```
If everything went well you should see [this](http://kentlin0830/nodejs-three-editor/issues)

### Change log ###

[releases](https://github.com/kentlin0830/nodejs-three-editor/pulls)
