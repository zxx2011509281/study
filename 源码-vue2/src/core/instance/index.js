import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

// Mixin 是 向 Vue.prototype上挂载方法  initLifecycle是添加 vm.$forceUpdate,vm.$destroy vm._update 方法
//  而  initMixin 中的 initLifecycle 是初始化实例属性
initMixin(Vue) // Vue构造函数的prototype属性会被添加_init方法
stateMixin(Vue) // 数据相关的实例方法 vm.$watch, vm.$set, vm.$delete. 并且会挂载上 $data 和 $props
eventsMixin(Vue) //  vm.$on vm.$off vm.$once vm.$emit这个四个方法
lifecycleMixin(Vue) // vm.$forceUpdate,vm.$destroy vm._update 
renderMixin(Vue) // vm.$nextTick  vm._render 的实现

export default Vue
