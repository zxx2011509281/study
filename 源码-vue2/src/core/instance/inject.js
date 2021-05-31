/* @flow */

import { hasOwn } from 'shared/util'
import { warn, hasSymbol } from '../util/index'
import { defineReactive, toggleObserving } from '../observer/index'

export function initProvide (vm: Component) {
  const provide = vm.$options.provide
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide
  }
}

export function initInjections (vm: Component) {
  // resolveInject 通过用户配置的inject,自底向上搜索可用的注入内容，把搜索结果返回
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    //  设置 接下来shouldObserve 为false 不会设置响应式 
    toggleObserving(false)
    // 把 每一项都 设置 到 vue实例上
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    // 恢复可以设置响应式
    toggleObserving(true)
  }
}

export function resolveInject (inject: any, vm: Component): ?Object {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    const result = Object.create(null)
    // 如果支持 symbol, 用 Reflect.ownkeys读取 symbol类型的属性，否则用Object.keys读取
    const keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject)

    // 比那里 indect 列表
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      // #6574 in case the inject object is observed...
      // inject 已经在 vue的实例上 跳过
      if (key === '__ob__') continue
      // 从 from 属性 获取 对应的 provide源属性key  。 injdect里面的属性都会处理为injdect:{ key: {from: 'test'}}
      const provideKey = inject[key].from
      let source = vm
      // 循环 向上 查找  ，实例上的 _provided中存在 inject获取的 key时，赋值给result对象
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey]
          break
        }
        source = source.$parent
      }
      // 如果向上遍历所有的实例 都没有 找到，此时 source 不存在
      // 尝试获取默认值 ，默认值如果是函数执行后返回 ，否则直接返回
      // 如果没有默认值 ，开发环境警告
      if (!source) {
        if ('default' in inject[key]) {
          const provideDefault = inject[key].default
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault
        } else if (process.env.NODE_ENV !== 'production') {
          warn(`Injection "${key}" not found`, vm)
        }
      }
    }
    // 返回 获取 到 的inject对应的值对象
    return result
  }
}
