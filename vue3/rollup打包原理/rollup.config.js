// rollup 配置

import path from 'path'
import ts from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import resolvePlugin from '@rollup/plugin-node-resolve'

console.log('___________________', process.env.TARGET);
// 根据环境变量中 target 属性，获取对应模块中的 package.json
if (!process.env.TARGET) {
  throw new Error('TARGET package must be specified via --environment flag.')
}

// 获取packages 目录
const packagesDir = path.resolve(__dirname, 'packages')

// 获取要打包的某个包 (打包的基本目录)
const packageDir = path.resolve(packagesDir, process.env.TARGET)

// 获取 对应打包目录 下的文件（这里用来取 package.json文件）
const resolve = p => path.resolve(packageDir, p)

// 获取package.json文件
const pkg = require(resolve(`package.json`))

// 获取 package.json文件中我们自定义的属性 buildOptions
const packageOptions = pkg.buildOptions || {}

// 获取我们 打包后的全局模块命名  
const name = packageOptions.filename || path.basename(packageDir)

//  对打包类型 做一个映射表 ，根据package.json中的 formats 来格式化 需要打包的内容
const outputConfigs = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundler.js`), // 打包后的文件 
    format: `es` // 采用的 格式
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: `cjs`
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: `iife` // 立即执行函数
  }
}

// 获取 package.json中 formats
const defaultFormats = ['esm-bundler', 'cjs'] // 默认formats 配置
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(',') // 环境变量中获取fromats配置
// 首先取 build.js中环境变量 formats 否则 到package.json中取  都没有取默认配置formats
const packageFormats = inlineFormats || packageOptions.formats || defaultFormats

// 循环调用 createConfig 处理 formats (比如： formats=['cjs', 'esm-bundler', 'global'])
const packageConfigs = packageFormats.map(format => createConfig(format, outputConfigs[format]))


function createConfig(format, output) {

  // 如果是全局模式  需要 配置名字
  const isGlobalBuild = /global/.test(format)
  if (isGlobalBuild) {
    output.name = packageOptions.name
  }

  // 生成sourcemap文件
  output.sourcemap = !!process.env.SOURCE_MAP

  // 生成roullup 配置
  return {
    input: resolve('src/index.ts'), // 入口
    output, //出口 就是上面的output
    plugins: [ // 插件  从上到下 
      json(), // import json from '@rollup/plugin-json'
      ts({ // import ts from 'rollup-plugin-typescript2'
        tsconfig: path.resolve(__dirname, 'tsconfig.json')
      }), 
      resolvePlugin(), //import resolvePlugin from '@rollup/plugin-node-resolve'
    ]
  }
}

// 导出配置变量
export default packageConfigs