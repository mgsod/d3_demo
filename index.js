if (module.hot) {
    module.hot.accept();

}

var express = require('express');
var proxy = require('http-proxy-middleware');
var path = require('path');
var app = express();
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpack = require("webpack");
var webpackConfig = require('./webpack.dev.config');
var compiler = webpack(webpackConfig);
app.use(webpackDevMiddleware(compiler, {
    publicPath:webpackConfig.output.publicPath
}));

app.use(express.static(path.join(__dirname, './')));
app.use(require("webpack-hot-middleware")(compiler));
app.use('/', proxy({ target: 'http://dpmbs2dev.dookoo.net', changeOrigin: true }));
app.listen(3000);
var c = require('child_process');
c.exec('start '+webpackConfig.output.publicPath);
