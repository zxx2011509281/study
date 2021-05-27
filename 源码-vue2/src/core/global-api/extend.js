/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { defineComputed, proxy } from '../instance/state'
import { extend, mergeOptions, validateComponentName } from '../util/index'

export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions: Object): Function {
    // 获取参数，默认 空对象
    extendOptions = extendOptions || {}
    const Super = this
    const SuperId = Super.cid
    // 尝试 获取 缓存 ，如果有直接返回
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    // 获取name 
    const name = extendOptions.name || Super.options.name
    // 非生产环境 校验 name命名是否规范
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }

    // 创建 子类
    const Sub = function VueComponent (options) {
      this._init(options)
    }
    // 子类继承 原型
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    // cid ++ 每个类的唯一标识
    Sub.cid = cid++
    // 合并父类 的options 到子类中
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    //  把父类 保存到子类的 super 属性中
    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    // 如果有 props，初始化props
    if (Sub.options.props) {
      initProps(Sub)
    }
    // 如果有 computed， 初始化
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    // 复制 父类的  extend  minxin use 方法
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    //  ASSET_TYPES ： [  'component', 'directive','filter']
    // 复制 父类 的 component  directive filter
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    // 启用递归自查找
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    // 子类上 新增 superOptions  extendOptions sealedOptions
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // cache constructor
    // 缓存自己
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

// 将 key 代理到 _props 中
function initProps (Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

// computed对象中每一项进行定义
function initComputed (Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
