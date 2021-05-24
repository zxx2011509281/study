/* @flow */

import {
  tip,
  toArray,
  hyphenate,
  formatComponentName,
  invokeWithErrorHandling
} from '../util/index'
import { updateListeners } from '../vdom/helpers/index'

export function initEvents (vm: Component) {
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  // init parent attached events
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}

let target: any

function add (event, fn) {
  target.$on(event, fn)
}

function remove (event, fn) {
  target.$off(event, fn)
}

function createOnceHandler (event, fn) {
  const _target = target
  return function onceHandler () {
    const res = fn.apply(null, arguments)
    if (res !== null) {
      _target.$off(event, onceHandler)
    }
  }
}

export function updateComponentListeners (
  vm: Component,
  listeners: Object,
  oldListeners: ?Object
) {
  target = vm
  updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
  target = undefined
}

export function eventsMixin (Vue: Class<Component>) {
  const hookRE = /^hook:/
  // vm.$on(event, callback)
  // 监听实例上的自定义事件，事件由$emit触发
  Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
    const vm: Component = this
    // 如果是参数是数组  遍历数组 ，每一项都递归调用vm.$on，使回调 可以被 数组中 每项事件名对应的 事件列表 监听
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn)
      }
    } else {
      // 不是数组 判断 vm._events中是否存在，不存在 设置为空数组 然后传入回调
      // _events是一个对象，对象上每一个 key（事件名）对应的都是 一个数组 ，数组中是监听的事件
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      // ？？？todo
      // 而不是哈希查找hook:event cost 使用在注册时标记的布尔标志
      // 而不是散列查找
      if (hookRE.test(event)) {
        vm._hasHookEvent = true
      }
    }
    return vm
  }

  Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this
    // 包装 fn事件， 调用的时候 ，移除自身。并执行 fn函数
    function on () {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    // 把fn函数挂载到 on事件上
    // vm.$off取消监听时 会判断 cb===fn || cb.fn === fn
    on.fn = fn
    // 监听 包装后的on 事件
    vm.$on(event, on)
    return vm
  }

  Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    const vm: Component = this
    // 如果没有传参数 ，移除所有的事件监听器
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }
    // 数组，遍历每一项 递归调用 vm.$off 移除对应的监听器
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }
    // 不是数组 获取 当前对应的 需要移除监听器的数组
    // vm._evnets是一个对象  
    const cbs = vm._events[event]
    // 如果 不存在，说明没有被 监听过，直接返回实例
    if (!cbs) {
      return vm
    }
    // 如果 没有传入需要移除的 监听器，那么移除该事件所有的监听器
    if (!fn) {
      vm._events[event] = null
      return vm
    }
    // 存在需要移除的监听事件 
    // 倒序循环  移除对应的事件
    // 倒序的好处是 splice之后 ，不会影响未被遍历到的监听器位置
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      // cb===fn是$on的监听器
      // cb.fn === fn 是 $once 的监听器
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }

  Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this
    // 不是线上环境
    if (process.env.NODE_ENV !== 'production') {
      // 获取小写的 触发事件名
      const lowerCaseEvent = event.toLowerCase()
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +
          `v-on to listen to camelCase events when using in-DOM templates. ` +
          `You should probably use "${hyphenate(event)}" instead of "${event}".`
        )
      }
    }
    // 获取 监听对象中  对应 触发事件名的 监听器列表
    let cbs = vm._events[event]
    if (cbs) {
      // toArray 把类似于数组的数据转换为真正的数组
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      // toArray 把类似于数组的数据转换为真正的数组， 它的第二个参数是起始位置
      const args = toArray(arguments, 1)
      const info = `event handler for "${event}"`
      // 遍历调用 invokeWithErrorHandling 处理监听器
      for (let i = 0, l = cbs.length; i < l; i++) {
        invokeWithErrorHandling(cbs[i], vm, args, vm, info)
      }
    }
    return vm
  }
}
