/**
 * Created by setting on 2017/11/1 0001.
 */
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin')
var path = require('path');
module.exports = {
    entry: __dirname + "/src/js/index.js",//已多次提及的唯一入口文件
    output: {
        path: __dirname + "/build",//打包后的文件存放的地方
        filename: "static/js/index.min.js"//打包后输出文件的文件名
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
        )
    ]
};
