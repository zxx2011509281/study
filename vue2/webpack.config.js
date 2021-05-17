const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
  entry: './src-2/index.js',
  output: {
    filename: '[name].js'
  },
  plugins: [
    //  创建一个空的html，自动引入打包输出的所有资源（js/css）
    new HtmlWebpackPlugin({
      // 模板
      template: './index.html'
    })
  ],
  devServer: {
    // 运行代码的目录
    contentBase: path.join(__dirname, 'dist'),    
    // 端口号
    port: 9000,
    // 自动打开
    open: true,
    // HRM
    hot: true,
    // 域名
    host: 'localhost',

  },
}