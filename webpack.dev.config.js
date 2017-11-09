/**
 * Created by setting on 2017/11/1 0001.
 */
var CopyWebpackPlugin = require('copy-webpack-plugin');
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin');
var hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=10000&reload=true';
module.exports = {
    entry: [hotMiddlewareScript, __dirname + "/src/js/index.js"],// 唯一入口文件
    output: {
        path: __dirname + "/build",
        filename: "static/js/index.min.js?t=[hash]",
        publicPath:'http://127.0.0.1:3000/build/'
    },
    externals: {
        jquery: 'window.$'
    },
    plugins: [
         new CopyWebpackPlugin([
             {
                 from: __dirname + '/src/static',
                 to: __dirname + '/build/static',
                 ignore:[]
             }
         ]),
        new HtmlWebpackPlugin({
                title: 'd3-app',
                template: 'src/index.html'
            }
        ),
        new webpack.HotModuleReplacementPlugin()

    ]
};
