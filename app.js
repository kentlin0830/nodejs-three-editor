'use strict';
const main = require('./controllers/main');
const compress = require('koa-compress');
const logger = require('koa-logger');
const serve = require('koa-static');
const route = require('koa-route');
const koa = require('koa');
const path = require('path');
const app = module.exports = koa();

// Logger
app.use(logger());

app.use(route.get('/', main.home));
app.use(route.get('/query_mongodb', main.query_mongodb));

// Serve static files
app.use(serve(path.join(__dirname, 'public')));
app.use(serve(path.join(__dirname, '.')));

// Compress
app.use(compress());

if (!module.parent) {
  app.listen(4000);
  console.log('listening on port 4000');
}
