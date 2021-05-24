/* @flow */
/* globals MutationObserver */

import { noop } from 'shared/util'
import { handleError } from './error'
import { isIE, isIOS, isNative } from './env'

// 标志  使用微任务
export let isUsingMicroTask = false

// 需要 执行的 函数
const callbacks = []
// 是否 nexttick执行中 只能有一个pending 
let pending = false

// 执行 nexttick传入的函数
function flushCallbacks () {
  // 重置pending 
  pending = false
  // 拷贝 callbacks 后置空
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

// 需要执行的 任务
let timerFunc

// 如果有 支持Promise , timerFunc 返回 为微任务 
// 执行到微任务会挂起 ，不会立即执行 ，等待当前宏任务或微任务执行完之后，才会执行 挂起的微任务
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // ios 中 回调被推送到微任务队列中，但队列没有被刷新，直到浏览器需要执行其他一些工作时
    // 添加一个空计时器来“强制”刷新微任务队列。
    if (isIOS) setTimeout(noop)
  }
  // 微任务标识 为true
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  // 非 ie  且 支持 MutationObserver（提供了监视对DOM树所做更改的能力）
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // 微任务 MutationObserver
  let counter = 1
  // 当观察到变动时执行的回调函数 flushCallbacks
  const observer = new MutationObserver(flushCallbacks)
  // 选择需要观察变动的节点
  const textNode = document.createTextNode(String(counter))
  // observe 配置MutationObserver在DOM更改匹配给定选项时，通过其回调函数开始接收通知。
  // {characterData: true} 观察器的配置（需要观察什么变动） 
  observer.observe(textNode, {
    characterData: true
  })
  // 执行 timerFunc 时， 修改节点， 节点的变通会 通知回调函数 flushCallbacks执行
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  // 微任务标识 为true
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // 上面不支持 返回宏任务 setImmediate（比setTimeout更好）
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  // 都不支持 返回宏任务 用 setTimeout 
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

// nextTick 多次使用 ，callbacks中会有多个回调放到 微任务或宏任务中 等待执行，
// pending 控制 nextTick只会执行一次，执行完之后callbacks 置空，pending 重置
export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  // callbacks中推入 自定义 函数 ()=>{}
  callbacks.push(() => {
    // 如果有 回调
    if (cb) {
      try {
        // 执行自定义函数时 ，执行 回调
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      // 如果没有传回调 ，执行自定义函数的时候， 执行 _resolve  （即下面 没有传入回调，但是支持promise,返回new promise, nextTick可以使用then）
      _resolve(ctx)
    }
  })
  // 如果pending 为false, 可以执行
  // timerFunc 会返回一个 promise.then微任务 ，挂起不会执行 ，当调用nextTick的那一层 宏任务执行完，才 会执行timerFunc 里面的微任务 。 而这个微任务 执行 一个函数 flushCallbacks ，flushCallbacks把callback里面的回调全部执行并清空
  if (!pending) {
    // pending 为true , 执行中。（只能有一个nextTicke）
    pending = true
    // 执行 nextTick处理的微任务或者宏任务
    timerFunc()
  }
  // 没有传入回调，但是支持promise,返回new promise, nextTick可以使用then
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
