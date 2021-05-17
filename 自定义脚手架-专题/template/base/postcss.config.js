/* eslint-disable import/order */
const { platform } = require('./package.json');

const plugins = platform == 'wap'
  ? [
    require('autoprefixer'),
    require('cssnano'),
    require('postcss-plugin-px2rem')({
      mediaQuery: true,
      minPixelValue: 3,
      rootValue: 100,
      exclude: ['/node_modules/'],
    }),
  ]
  : [];

module.exports = {
  plugins,
};
