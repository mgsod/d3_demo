var express = require('express');
var proxy = require('http-proxy-middleware');
var path = require('path');
var app = express();
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpack = require("webpack");
var webpackConfig = require('./webpack.config');

var compiler = webpack(webpackConfig);
app.use(webpackDevMiddleware(compiler, {

}));

app.use(express.static(path.join(__dirname, './')));
app.use('/', proxy({ target: 'http://dpmbs2dev.dookoo.net', changeOrigin: true }));
app.listen(3000);
var c = require('child_process');
c.exec('start http:127.0.0.1:3000/build/index.html');
