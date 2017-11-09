/**
 * Created by setting on 2017/11/1 0001.
 */
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    entry: __dirname + "/src/js/index.js",
    output: {
        path: __dirname + "/build",
        filename: "static/js/index.min.js?t=[hash]"
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
