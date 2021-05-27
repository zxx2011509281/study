/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  // component filter directive
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      // definition 不存在 那么就是读取 直接找到返回
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        // 注册操作
        
        // 开发环境 要 校验 component 的第一个 参数 id 是否 命名规范
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        // 如果是 注册 组件   且  definition 是对象 _toString.call(obj) === '[object Object]'
        if (type === 'component' && isPlainObject(definition)) {
          // 没有设置 组件名 或自动 使用给定 id(第一个参数) 命名
          definition.name = definition.name || id
          // Vue.options._base = Vue
          // Vue.extend(definition) 把definition变成Vue的子类
          definition = this.options._base.extend(definition)
        }
        // 注册指令 如果是函数  默认监听 bind 和 update 两个事件
        // 不是函数 的话，下面直接赋值 给 this.options.directives[id]即可
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        // 把用户 指令 或组件 参数 保存 到 对应的 options上 
        this.options[type + 's'][id] = definition

        // 方法 处理 过的 definition
        return definition
      }
    }
  })
}
