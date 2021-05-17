const webpackMerge = require('webpack-merge');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const common = require('./webpack.common.js');

const webpackConfig = {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          // 'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      // 打包css文件
      filename: 'css/[name].[contenthash:7].css', // 类似出口文件
    }),
  ],
};

// 打包分析
if (process.argv.slice(2).includes('--analyze')) {
  webpackConfig.plugins.push(new BundleAnalyzerPlugin());
}

module.exports = webpackMerge(common, webpackConfig);
