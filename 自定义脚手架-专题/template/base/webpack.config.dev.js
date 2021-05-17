const webpackMerge = require('webpack-merge');
const webpack = require('webpack');
const common = require('./webpack.common.js');
const { year, name } = require('./package.json');

const webpackConfig = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: { // 这部分详见有道云笔记
    inline: true, // 设置为true，代码有变化，浏览器端刷新。
    hot: true,
    open: true, // :在默认浏览器打开url(webpack-dev-server版本> 2.0)
    historyApiFallback: true, // 回退:支持历史API。
    host: 'localhost', // ip地址，同时也可以设置成是localhost,
    progress: true, // 让编译的输出内容带有进度和颜色
    contentBase: `./dev-dist/${name}`, // 本地服务器所加载的页面所在的目录
    openPage: `index_demo-${year}-${name}.html`, // 配置打开的页面
    // publicPath: '/src/',  无需单独设置，会默认执行output的path路径，代表将资源打包到某路径下
    // proxy: {
    //     '*': {
    //         target: 'http://127.0.0.1:3430', //跨域Ip地址
    //         secure: false
    //     }
    // },
  },
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
  ],
};

module.exports = webpackMerge(common, webpackConfig);
