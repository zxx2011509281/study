import HtmlWebpackPlugin from 'html-webpack-plugin';
import { getEntries, templateContent } from '../htmlHandler';

import { projectPath } from './PATH';

const path = require('path');
const webpack = require('webpack');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
// todo extractCss
let { entryObj, htmlMap } = getEntries();

const isDev = process.env.NODE_ENV !== 'production';
let HtmlWebpackPluginList = Object.keys(htmlMap).map((filename) => {
  console.log('htmlFileName', filename);
  return new HtmlWebpackPlugin({
    filename,
    // templateContent: htmlMap[filename].content,
    inject: false,
    minify: false,
    templateContent: templateContent(filename),
  });
});
const getDistPath = () => {
  let tempProjectPath = projectPath;
  const cutPath = path.join(__dirname, '../../');
  // windows下会有问题，判断一下
  if (projectPath.indexOf(':') != -1
      && projectPath.length >= cutPath.length
      && cutPath == projectPath.substring(0, cutPath.length)) {
    tempProjectPath = projectPath.substring(cutPath.length);
    return path.join(cutPath, 'dist', tempProjectPath);
  }
  return path.join(__dirname, '../../', 'dist', projectPath);
};

export default {
  entry: entryObj,
  output: {
    library: 'init',
    libraryTarget: 'umd',
    path: getDistPath(),
    filename: isDev ? '[name].js' : '[name]-[contenthash:7].js',
    chunkFilename: isDev ? '[name]-chunk.js' : '[name]-[contenthash:7].js',
    publicPath: '/',
    crossOriginLoading: 'anonymous',
  },
  plugins: [
    ...HtmlWebpackPluginList,
    new CaseSensitivePathsPlugin(),
    new LodashModuleReplacementPlugin({
      collections: true,
      shorthands: true,
      paths: true,
    }),
    // new MiniCssExtractPlugin({
    //   filename: 'css/[name]-[contenthash].css',
    //   chunkFilename: 'css/[name]-[contenthash].css',
    // }),
    new webpack.ContextReplacementPlugin(
      /moment[/\\]locale$/,
      /en-gb|zh-cn/,
    ),
    // 本地分析打包模块，需要时开启
    // new BundleAnalyzerPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        sideEffects: true,
        use: [
          // isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.scss$/,
        sideEffects: true,
        use: [
          // isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: isDev,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: path.resolve(__dirname, './postcss.config.js'),
              },
              sourceMap: isDev,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: isDev,
            },
          },
        ],
      },
      {
        test: /\.(?:png|jpe?g|gif|svg|woff|eot|ttf|wav)\??.*$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: `${isDev ? '' : '/'}img/[name]-[sha512:hash:base64:7].[ext]`,
              esModule: false,
            },
          },
        ],
      },
      // {
      //   test: /\.(?:png|jpe?g|gif|svg|woff|eot|ttf|wav)\??.*$/,
      //   loader: 'file-loader'
      // },
      {
        test: /\.jsx?$|\.es6$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              configFile: path.resolve(__dirname, './babel.config.js'),
            },
          },
        ],
      },
      {
        test: /\.tpl$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'html-loader',
            options: {

            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.es6', '.js', '.jsx', '.scss'],
    modules: [
      'node_modules',
      path.resolve(__dirname, '../../', projectPath),
      path.resolve(__dirname, '../../'),
      path.resolve(__dirname, '../../', 'framework/css'), // sass
    ],
  },
};
