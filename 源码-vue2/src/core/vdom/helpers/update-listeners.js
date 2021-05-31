/* @flow */

import {
  warn,
  invokeWithErrorHandling
} from 'core/util/index'
import {
  cached,
  isUndef,
  isTrue,
  isPlainObject
} from 'shared/util'

const normalizeEvent = cached((name: string): {
  name: string,
  once: boolean,
  capture: boolean,
  passive: boolean,
  handler?: Function,
  params?: Array<any>
} => {
  const passive = name.charAt(0) === '&'
  name = passive ? name.slice(1) : name
  const once = name.charAt(0) === '~' // Prefixed last, checked first
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
  return {
    name,
    once,
    capture,
    passive
  }
})

export function createFnInvoker (fns: Function | Array<Function>, vm: ?Component): Function {
  function invoker () {
    const fns = invoker.fns
    if (Array.isArray(fns)) {
      const cloned = fns.slice()
      for (let i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling(cloned[i], null, arguments, vm, `v-on handler`)
      }
    } else {
      // return handler return value for single handlers
      return invokeWithErrorHandling(fns, null, arguments, vm, `v-on handler`)
    }
  }
  invoker.fns = fns
  return invoker
}


export function updateListeners (
  on: Object, // 需要执行的事件列表
  oldOn: Object, // 旧的事件列表
  add: Function, // 新增 函数
  remove: Function, // 移除 函数
  createOnceHandler: Function, // 一次性 执行事件
  vm: Component // 实例
) {
  let name, def, cur, old, event
  // 循环 需要执行的事件列表
  for (name in on) {
    def = cur = on[name]
    old = oldOn[name]
    event = normalizeEvent(name)
    /* istanbul ignore if */
    if (__WEEX__ && isPlainObject(def)) {
      cur = def.handler
      event.params = def.params
    }
    // 判断事件名对应的值是否是 undefined和null。如果是调用控制台警告
    if (isUndef(cur)) {
      process.env.NODE_ENV !== 'production' && warn(
        `Invalid handler for event "${event.name}": got ` + String(cur),
        vm
      )
    } 
    // 判断事件名 是否 在oldOn中 ，如果不存在，则调用 add 注册事件
    else if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur, vm)
      }
      if (isTrue(event.once)) {
        // 一次性 事件
        cur = on[name] = createOnceHandler(event.name, cur, event.capture)
      }
      add(event.name, cur, event.capture, event.passive, event.params)
    }
    //  如果 on和oldOn都存在，但是它们不相同，则将事件回调替换成 on 中的回调，并且把on 中的回调引用指向真实的事件系统中注册的事件，也就是 oldOn 中对应的事件
    else if (cur !== old) {
      old.fns = cur
      on[name] = old
    }
  }
  // 循环 旧 的事件列表
  // 删除 不存在 的事件
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name)
      remove(event.name, oldOn[name], event.capture)
    }
  }
}
