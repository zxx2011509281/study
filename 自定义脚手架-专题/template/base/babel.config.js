const presets = [
  ['@babel/preset-env', {
    useBuiltIns: 'usage',
    corejs: '2.6',
    modules: 'commonjs', // 启用将ES6模块语法转换为其他模块类型，设置为false不会转换模块。
  }],
];

module.exports = {
  presets,
  plugins: [
    ['import', {
      libraryName: 'vant',
      libraryDirectory: 'es',
      style: true,
    }, 'vant'],
  ],
};
