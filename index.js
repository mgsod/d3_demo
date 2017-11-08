var express = require('express');
var proxy = require('http-proxy-middleware');
var path = require('path');
var app = express();
app.use(express.static(path.join(__dirname, './')));//静态资源index.html和node代码在一个目录下
app.use('/', proxy({ target: 'http://dpmbs2dev.dookoo.net', changeOrigin: true }));
app.listen(3000);
var c = require('child_process');
c.exec('start http:127.0.0.1:3000/build/index.html');