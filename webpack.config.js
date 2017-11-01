/**
 * Created by setting on 2017/11/1 0001.
 */

module.exports = {
    entry:  __dirname + "/js/index.js",//已多次提及的唯一入口文件
    output: {
        path: __dirname + "/js",//打包后的文件存放的地方
        filename: "index.min.js"//打包后输出文件的文件名
    },
    externals: {
        jquery: 'window.$'}
};
