/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // 获取 Vue的 已注册插件列表
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    // 如果 已经有该插件 直接返回 避免重复注册
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    // 获取 插件传入的参数 （从第二个参数开始）
    const args = toArray(arguments, 1)
    // 把 Vue 作为第一个参数
    args.unshift(this)
    // 如果插件 有install 方法 并且是函数 执行 install方法
    //  把含有 Vue的参数作为参数执行
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      // 如果 plugin 没有install 方法，当plugin 就是一个 函数
      // 把含有 Vue的参数作为参数执行
      plugin.apply(null, args)
    }
    // 保存当前 插件 到 已注册 插件列表中
    installedPlugins.push(plugin)
    return this
  }
}
