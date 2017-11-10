/**
 * Created by setting on 2017/11/1 0001.
 */
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    entry: __dirname + "/src/js/index.js",
    output: {
        path: __dirname + "/dist",
        filename: "static/js/index.min.js?t=[hash]"
    },
    externals: {
        jquery: 'window.$'
    },
    module:{
        loaders: [
            {
                test: /\.vue$/,
                exclude: /node_modules/,
                loader: 'vue-loader'
            },
            {
                test:/\.js$/,
                loader:"babel-loader"
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: __dirname + '/src/static',
                to: __dirname + '/dist/static',
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
