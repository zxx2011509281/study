/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import { mark, measure } from '../util/perf'
import { createEmptyVNode } from '../vdom/vnode'
import { updateComponentListeners } from './events'
import { resolveSlots } from './render-helpers/resolve-slots'
import { toggleObserving } from '../observer/index'
import { pushTarget, popTarget } from '../observer/dep'

import {
  warn,
  noop,
  remove,
  emptyObject,
  validateProp,
  invokeWithErrorHandling
} from '../util/index'

export let activeInstance: any = null
export let isUpdatingChildComponent: boolean = false

export function setActiveInstance(vm: Component) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}

export function initLifecycle (vm: Component) {
  const options = vm.$options

  // locate first non-abstract parent
  // 找出第一个非抽象父类
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}

export function lifecycleMixin (Vue: Class<Component>) {
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    const restoreActiveInstance = setActiveInstance(vm)
    vm._vnode = vnode
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    restoreActiveInstance()
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  }

  // 手动更新实例
  Vue.prototype.$forceUpdate = function () {
    const vm: Component = this
    // 如果实例有 watcher 则 手动 触发 watcher的update方法 重新渲染
    if (vm._watcher) {
      vm._watcher.update()
    }
  }

  // 销毁实例
  Vue.prototype.$destroy = function () {
    const vm: Component = this
    // 防止 被重复调用  如果_isBeingDestroyed为true,则正在销毁中或者已经被销毁了
    if (vm._isBeingDestroyed) {
      return
    }
    // 触发 beforeDestroy 的钩子函数
    callHook(vm, 'beforeDestroy')
    // 设置_isBeingDestroyed 为ture 标识正在销毁中
    vm._isBeingDestroyed = true
    // 移除当前组件与 父组件的连接 （父组件中删除 自己）
    const parent = vm.$parent
    // 父组件存在 && 父组件没有被销毁 && 不是抽象组件
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm)
    }

     // vm._watcher 是vue实例上的，监听组件中的所有状态（状态的依赖列表）
    // 从所有依赖项的Dep 列表中 将自己移除 （从其他dep中移除当前实例的watcher）
    // 移除之后，当状态发生变化时，watcher实例就不会再得到通知了   
    if (vm._watcher) {
      vm._watcher.teardown()
    }
    // vm._watchers 是用户调用vm.$watche创建的 的依赖列表
    let i = vm._watchers.length
    while (i--) {
      // 也跳跃watcher实例的teardown 移除自身
      vm._watchers[i].teardown()
    }
    // ？？？todo
    // 从数据对象中删除引用
    // 冻结对象可能没有观察者。
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--
    }
    // 添加_isDestroyed 属性，标识vue实例已经被销毁
    vm._isDestroyed = true
    // invoke destroy hooks on current rendered tree
    // 不会将已经渲染到页面的DOM节点移除，但是会把模板中的所有指令解绑
    vm.__patch__(vm._vnode, null)
    // 触发destroyed钩子
    callHook(vm, 'destroyed')
    // 移除所有的事件监听器
    vm.$off()
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null
    }
    // todo??? 发布循环引用
    if (vm.$vnode) {
      vm.$vnode.parent = null
    }
  }
}

export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  // 不存在 render 
  if (!vm.$options.render) {
    // render 被赋值 空的 虚拟节点
    vm.$options.render = createEmptyVNode
    // 如果是 非 生成环境 会警告用户 
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      // runtime-only 运行时版本 不带编译器 ，必须用render
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  // 执行 beforeMount 生命周期
  callHook(vm, 'beforeMount')

  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    // 生成环境 
    // _update作用是： 调用虚拟DOM中的patch方法 来执行节点的对比与渲染操作
    // _render作用是：执行渲染函数，得到一份最新的Vnode节点树
    // vm._update(vm._render())的作用 是 先调用渲染函数 获取一份最新的Vnode节点树， 然后通过 _update方法 对最新的 Vnode和 旧Vnode进行对比，更新DOM节点。
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  // 函数中所有读取的数据都 将被watcher 观察， 这些数据中间任何一个发生变化，watcher都将得到 通知。 触发更新。
  // Watcher 的第二个参数支持 函数， 如果是函数，那么就会观察函数中所有 读取vue实例 上的 响应式数据。
  // 当 数据变化时(vm._render（）中的响应式数据)， 触发 dep.notify 然后 让 当前 watcher.update -》 this.run-->重新 执行 updateComponent 函数 ，更新 patch 页面
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // 手动挂载实例，调用自行挂载
  // mounted is called for render-created child components in its inserted hook
  // 在插入的钩子中为渲染创建的子组件调用mounted
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}

export function updateChildComponent (
  vm: Component,
  propsData: ?Object,
  listeners: ?Object,
  parentVnode: MountedComponentVNode,
  renderChildren: ?Array<VNode>
) {
  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = true
  }

  // determine whether component has slot children
  // we need to do this before overwriting $options._renderChildren.

  // check if there are dynamic scopedSlots (hand-written or compiled but with
  // dynamic slot names). Static scoped slots compiled from template has the
  // "$stable" marker.
  const newScopedSlots = parentVnode.data.scopedSlots
  const oldScopedSlots = vm.$scopedSlots
  const hasDynamicScopedSlot = !!(
    (newScopedSlots && !newScopedSlots.$stable) ||
    (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
    (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key) ||
    (!newScopedSlots && vm.$scopedSlots.$key)
  )

  // Any static slot children from the parent may have changed during parent's
  // update. Dynamic scoped slots may also have changed. In such cases, a forced
  // update is necessary to ensure correctness.
  const needsForceUpdate = !!(
    renderChildren ||               // has new static slots
    vm.$options._renderChildren ||  // has old static slots
    hasDynamicScopedSlot
  )

  vm.$options._parentVnode = parentVnode
  vm.$vnode = parentVnode // update vm's placeholder node without re-render

  if (vm._vnode) { // update child tree's parent
    vm._vnode.parent = parentVnode
  }
  vm.$options._renderChildren = renderChildren

  // update $attrs and $listeners hash
  // these are also reactive so they may trigger child update if the child
  // used them during render
  vm.$attrs = parentVnode.data.attrs || emptyObject
  vm.$listeners = listeners || emptyObject

  // update props
  if (propsData && vm.$options.props) {
    toggleObserving(false)
    const props = vm._props
    const propKeys = vm.$options._propKeys || []
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i]
      const propOptions: any = vm.$options.props // wtf flow?
      props[key] = validateProp(key, propOptions, propsData, vm)
    }
    toggleObserving(true)
    // keep a copy of raw propsData
    vm.$options.propsData = propsData
  }

  // update listeners
  listeners = listeners || emptyObject
  const oldListeners = vm.$options._parentListeners
  vm.$options._parentListeners = listeners
  updateComponentListeners(vm, listeners, oldListeners)

  // resolve slots + force update if has children
  if (needsForceUpdate) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context)
    vm.$forceUpdate()
  }

  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = false
  }
}

function isInInactiveTree (vm) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) return true
  }
  return false
}

export function activateChildComponent (vm: Component, direct?: boolean) {
  if (direct) {
    vm._directInactive = false
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false
    for (let i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i])
    }
    callHook(vm, 'activated')
  }
}

export function deactivateChildComponent (vm: Component, direct?: boolean) {
  if (direct) {
    vm._directInactive = true
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true
    for (let i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i])
    }
    callHook(vm, 'deactivated')
  }
}

// callHook(vm, 'beforeUpdate')
export function callHook (vm: Component, hook: string) {
  // #7573 disable dep collection when invoking lifecycle hooks
  // 获取全局当前 唯一的watcher
  pushTarget()
  // 尝试获取 对应 hook的函数 列表
  const handlers = vm.$options[hook]
  const info = `${hook} hook`
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      // 遍历执行 
      invokeWithErrorHandling(handlers[i], vm, null, vm, info)
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
  // 删除targetStack从删除最后一个 targetStack.pop()
  // Dep.target = targetStack[targetStack.length - 1]
  popTarget()
}
