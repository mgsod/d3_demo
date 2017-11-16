/**
 * Created by setting on 2017/11/1 0001.
 */
var CopyWebpackPlugin = require('copy-webpack-plugin');
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin');
var hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=10000&reload=true';
module.exports = {
    entry: {
        index: __dirname + "/src/js/index.js",
        list: __dirname + "/src/js/list.js"
    },
    output: {
        path: __dirname + "/build",
        filename: "static/js/[name].min.js?t=[hash]",
        publicPath: 'http://127.0.0.1:3000/build/'
    },
    externals: {
        jquery: 'window.$'
    },
    plugins: [
       /* new webpack.optimize.CommonsChunkPlugin({
            name: 'vendors', // 将公共模块提取，生成名为`vendors`的chunk
            chunks: ['index', 'list'], //提取哪些模块共有的部分
            minChunks: 3 // 提取至少3个模块共有的部分
        }),*/
        new CopyWebpackPlugin([
            {
                from: __dirname + '/src/static',
                to: __dirname + '/build/static',
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
                chunks: ['index']
            }
        ),
        new webpack.HotModuleReplacementPlugin()

    ]
};
