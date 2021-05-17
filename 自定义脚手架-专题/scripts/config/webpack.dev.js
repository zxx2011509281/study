/* eslint-disable import/order */
let babelConfig = require('./babel.config');
// 把preset中的modules打开,因为 node 代码运行之前不经过 webpack 编译
babelConfig.presets.forEach((preset) => {
  if (Array.isArray(preset) && preset[0] === '@babel/preset-env') {
    preset[1].modules = 'auto';
  }
});
require('@babel/register')(
  babelConfig,
);
const path = require('path');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const common = require('./webpack.common');
let PATH = require('./PATH');

let devWebpackConfig = webpackMerge.merge(common, {
  mode: 'development',
  devtool: '#cheap-module-eval-source-map',
  devServer: {
    hot: true,
    open: true, //todo open
    // openPage: 'webpack-dev-server',
    host: 'localhost',
    port: 3000,
    // serveIndex: true, // todo: 显示目录
    inline: true,
    writeToDisk: true,
    disableHostCheck: true,
    contentBase: path.join(__dirname, '../../', PATH.projectPath),
    stats: {
      colors: true,
      verbose: true,
    },
    historyApiFallback: true,
    before(app) {
      // apiMocker(app, path.join(__dirname, './mock/index.js'));
    },
    proxy: {
      '/api': {
        target: 'https://t.neibu.kooup.com',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
      },
    },
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
});
console.log('=================================');
console.log(devWebpackConfig);
console.log('=================================');
module.exports = devWebpackConfig;
