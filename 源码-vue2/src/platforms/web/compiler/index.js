/* @flow */

import { baseOptions } from './options'
import { createCompiler } from 'compiler/index'

const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions }


export function createCompileToFunctionFn (compile: Function): Function {
  // 创建缓存对象
  const cache = Object.create(null)

  // 返回编译 template为 render 函数
  return function compileToFunctions (
    template: string,
    options?: CompilerOptions,
    vm?: Component
  ): CompiledFunctionResult {
    // 将options 属性混入到空对象中，目的是让options成为 可选参数
    options = extend({}, options)

    // check cache
    // 检查缓存 是否存在编译后的模板，存在直接返回
    const key = options.delimiters
      ? String(options.delimiters) + template
      : template
    if (cache[key]) {
      return cache[key]
    }

    // 编译 后类似于 `width(this){return _c('div', {attrs: {"id": "el"}}, [_v("Hello" + _s(name))])}`
    const compiled = compile(template, options)


    // turn code into functions
    // 把代码字符串 转换为 函数 
    const res = {}
    res.render = createFunction(compiled.render)

    // 缓存结果 并返回
    return (cache[key] = res)
  }
}