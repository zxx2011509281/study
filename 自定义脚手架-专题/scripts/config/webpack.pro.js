// eslint-disable-next-line
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
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const { projectPath } = require('./PATH');

const jenkinsEnv = process.env.environment;
console.log('jenkinsEnv:', jenkinsEnv);
let isProduction = true;
let publicPath = '//daxueui-oss.koocdn.com/zhuanti/';
if (jenkinsEnv === 'neibu') {
  isProduction = false;
  publicPath = '//daxueui-osstest.koocdn.com/zhuanti/';
}
publicPath += projectPath;
console.log('publicPath', publicPath);
let prodWebpackConfig = merge(common, {
  output: {
    publicPath,
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  mode: 'production',
  devtool: isProduction ? 'nosources-source-map' : 'source-map',
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.NamedChunksPlugin(),
    // new CopyPlugin({
    //   patterns: [
    //     { from: `${projectPath}/package.json` },
    //   ],
    // }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'chars-replace-loader',
            options: {
              search: '(?:window\\.)?console\\.(log|info|warn|error)\\((["\\\'])tracker\\2,(.*)\\)(,|;)?',
              flags: 'g',
              /**
                             * console.log 换为日志工具
                             * @param match
                             * @param fn 匹配的方法类型
                             * @param quot 单引号还是双引号
                             * @param logs 实际上报的参数
                             * @param tailed 结尾符号
                             * @param offset 当前命中字符串（match）的偏移值
                             * @param string 字符串本串
                             * @returns {string}
                             */
              replace(match, fn, quot, logs, tailed, offset, string) {
                const filename = this.resourcePath.replace(process.env.PWD, '');
                const line = string.substr(0, offset).split('\n').length;
                return `(function(that){function parseArg(){ return [].slice.call(arguments).join(";"); };window.errortracker && window.errortracker.${fn}({ message: parseArg(${logs}), line: ${line}, filename: "${filename}" });}).call(this)${tailed || ''}`;
              },
            },
          },
        ],
      },
    ],
  },
});
console.log('=================================');
console.log(prodWebpackConfig);
console.log('=================================');
module.exports = prodWebpackConfig;
