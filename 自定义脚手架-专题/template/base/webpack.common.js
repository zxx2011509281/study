const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const { name, year } = require('./package.json');

const env = process.env.NODE_ENV;
console.log('===============================');
console.log(`当前打包环境：${env}`);
console.log('===============================');

const pathConfig = {
  development: {
    chipPath: `/project/zt/${year}/${name}`,
    publicPath: '',
    outputPath: `dev-dist/${name}`,
  },
  neibu: {
    chipPath: `/project/zt/${year}/${name}`,
    // publicPath: `./`,
    publicPath: `//daxueui-osstest.koocdn.com/static/project/zt/${year}/${name}/`,
    outputPath: `neibu-dist/${name}`,
  },
  production: {
    chipPath: `/project/zt/${year}/${name}`,
    publicPath: `//daxueui-oss.koocdn.com/static/project/zt/${year}/${name}/`,
    outputPath: `pro-dist/${name}`,
  },
};
const { chipPath, publicPath, outputPath } = pathConfig[env];

let webpackConfig = {
  entry: {
    index: path.resolve(__dirname, './src/index.js'),
  },
  output: {
    path: path.resolve(`${__dirname}/${outputPath}`),
    publicPath,
    filename: env === 'development' ? 'js/[name].js':'js/[name].[contenthash:7].js',
    chunkFilename: env === 'development' ? 'js/[name].chunk.js': 'js/[name].chunk.[contenthash:7].js',
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  resolve: {
    alias: {
      '@': path.resolve('src'),
      components: path.resolve('src/components'),
      '@ccp': path.resolve(__dirname,'../../../common/commonComponents')
    },
    extensions: ['.js', '.less', '.css', '.vue', '.jsx', '.scss'],
  },
  module: {
    rules: [
      {
        test: /\.(html|tpl)$/,
        loader: 'html-loader',
      },
      {
        test: /\.ejs$/,
        exclude: /node_modules/,
        loader: 'ejs-loader',
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      }, {
        test: /\.js$/,
        include: [
          path.join(__dirname, '/src'),
        ],
        exclude: path.resolve(__dirname, 'node_modules'),
        loader: 'babel-loader',
      }, {
        test: /\.xml$/,
        loader: 'xml-loader',
      },
      {
        test: /\.(png|jpg|jpeg|gif|icon|webp)$/,
        loader: 'url-loader',
        options: {
          limit: 16384,
          name: 'i/[name].[contenthash:5].[ext]',
        },
      },
      {
        test: /\.(woff|woff2|svg|eot|ttf)\??.*$/,
        loader: 'file-loader?&name=assets/fonts/[name].[ext]',
      }, {
        test: /\.txt$/,
        loader: 'text-loader',
      }, {
        test: /\.jsx$/,
        exclude: /node_modules/,
        loaders: ['jsx-loader', 'babel-loader'],
      }],
  },
  optimization: {
    // 代码分割
    splitChunks: {
      cacheGroups: {
        // 公共依赖
        vendors: {
          name: 'vendors',
          chunks: 'all',
          priority: 0,
          reuseExistingChunk: true,
          test: /[\\/]node_modules[\\/]/,
        },
        /*
                // 依赖库以外的代码公共部分，例如自己代码里用的比较多的公共组件
                manifest: {
                    name: 'manifest',
                    chunks: 'all',
                    priority: 0,
                    test: /src[\\/]/
                }
                */
      },
      minSize: 30000,
      name: true,
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      env,
      chipPath,
      publicPath,
      inject: 'true',
      hash: true,
      template: path.resolve(__dirname, 'src/index.ejs'),
      filename: path.resolve(__dirname, `${outputPath}/index_demo-${year}-${name}.html`),
    }),
    new CopyWebpackPlugin([{
      from: `${__dirname}/src/public/`,
    }]),
    new VueLoaderPlugin(),
  ],
};

// 处理碎片
try {
  let chips = [];
  if (fs.existsSync('./src/chip')) {
    chips = fs.readdirSync('./src/chip').filter((_name) => /\.ejs$/.test(_name));
  }
  if (chips.length) {
    console.log(chalk.blue(`\n\nchips:\n${chips.join(', ')}\n\n`));
    webpackConfig.plugins = webpackConfig.plugins.concat(
      chips.map((chip) => new HtmlWebpackPlugin({
        inject: false,
        publicPath,
        template: path.resolve(__dirname, `./src/chip/${chip}`),
        filename: `chip/${chip.replace(/\.\w+$/, '.html')}`,
      })),
    );
  } else {
    console.log(chalk.blue('没有找到碎片文件'));
  }
} catch (e) {
  console.log(chalk.red(`读取碎片失败：\n${e}`));
}

module.exports = webpackConfig;
