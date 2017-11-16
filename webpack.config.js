/**
 * Created by setting on 2017/11/1 0001.
 */
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    entry: {
        index: __dirname + "/src/js/index.js",
        list: __dirname + "/src/js/list.js"
    },
    output: {
        path: __dirname + "/dist",
        filename: "static/js/[name].min.js?t=[hash]"
    },
    externals: {
        jquery: 'window.$'
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: __dirname + '/src/static',
                to: __dirname + '/dist/static',
                ignore: []
            }
        ]),
        new HtmlWebpackPlugin({
                filename: 'index.html',
                title: 'd3-app',
                template: 'src/index.html',
                chunks: ['index']
            }
        ),
        new HtmlWebpackPlugin({
                filename: 'list.html',
                title: 'd3-app',
                template: 'src/list.html',
                chunks: ['list']
            }
        ),
    ]
};
