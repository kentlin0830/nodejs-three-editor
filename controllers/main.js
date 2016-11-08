'use strict';
const views = require('co-views');
const parse = require('co-body');
const mongodb = require('./mongodb');

const render = views(__dirname + '/../views', {
  map: { html: 'swig' }
});

var database;
module.exports.home = function *home(ctx) {
  if (database === undefined) {
    database = yield mongodb.initialize();
  }
  console.log("database", JSON.stringify(database));
  this.body = yield render('three_editor', { parameters: database });
};

module.exports.query_mongodb = function *query_mongodb(ctx) {
  console.log("query_mongodb: " + JSON.stringify(this.query));
  var tables = this.query.tables.split(",");
  var actions = this.query.actions.split(",");
  var object = new Object();
  for (var i=0; i<tables.length; ++i) {
    var params = actions[i].split(";");
    switch (params[0]) {
      case "add":
        object[tables[i]] = yield mongodb.add(tables[i], params.slice(1));
        break;
      case "delete":
        object[tables[i]] = yield mongodb.delete(tables[i], params.slice(1));
        break;
      case "get":
        object[tables[i]] = yield mongodb.get(tables[i], params.slice(1));
        break;
      case "set":
        object[tables[i]] = yield mongodb.set(tables[i], params.slice(1));
        break;
    }
  }
  this.body = object;
};
