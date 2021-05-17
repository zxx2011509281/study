
// 重写 数组的七个方法 以便实现响应式, 把重写后的 方法暴露出去
// 为什么要有这个方法 。改变对象的值，可以触发依赖更新。但是 数组的 push,pop等方法不会触发依赖更新。所有需要重写数组的七个方法 以实现 使用push，pop等方法时触发依赖更新

import { def } from './util.js'

// 得到 Array.prototype
const arrayPrototype = Array.prototype

// 需要被改写的 数组方法
const methodsNeedChange = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']

// 以 Array.prototype 为原型创建 arrayMethods 对象
export const arrayMethods = Object.create(arrayPrototype)

methodsNeedChange.forEach(methodName => {
  // 备份原来的方法, 方法原来的功能需要保留
  const original = arrayPrototype[methodName]

  // 定义新的方法(方法是对象，所有可以调用前面封装的def方法) 
  def(arrayMethods, methodName, function () {

    // 恢复原来的功能，执行数组方法
    const result = original.apply(this, arguments)

    // push, unshift, splice 会插入新值。 新值需要调用observe方法也 转换为 响应式
    let inserted = null

    // 获得 数组身上 的__ob__
    const ob = this.__ob__;

    // arguments 是类数组 ，没有slice方法 ，把arguments 转换为数组
    const ars = [...arguments]

    switch (methodName) {
      case 'push':
      case 'unshift':
        inserted = arguments;
        break;
      case 'splice':
        // splice (位置，删除几项, 插入的第1个值，插入的第2个值，插入的第3个值。。。)
        inserted = ars.slice(2)
        break;
    }

    // 判断有没有inserted, 有新值 也变为响应式
    if (inserted) {
      ob.observeArray(inserted)
    }
    console.log('触发array.js_啦啦啦啦啦啦');
    // pop，shift 会有返回在
    return result

  }, false)
})
