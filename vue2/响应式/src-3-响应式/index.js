import Watcher from './Watcher.js'

Vue.prototype.$watch = function (expOrFn, cb, options) {
  const vm = this
  options = options || {}
  const watcher = new Watcher(vm, expOrFn, options)
  // 立即执行
  if(options.immediate){
    cb.call(vm, watcher.value)
  }

  //  返回 停止 观察函数
  return function unwatchFn(){
    watcher.teardown()
  }  
}
import {set} from './Observer'
Vue.prototype.$set = set

import {del} from './Observer'
Vue.prototype.$delete = del