import { def } from './util.js'
import defineReactive from './defineReactive.js'
import { arrayMethods } from './array.js'
import observe from './Observe.js'


// 把对象 转换 成 每个层级的属性 都是响应式的对象(可以被侦测)； 比如： obj:{a:{b:{c: 5}}}
export default class Observer {
  constructor(value) {
    // 给value(对象) 添加了 __ob__ 的属性，值是 这次new 的实例(构造函数中的this 表示的是实例)，并且不可枚举
    def(value, '__ob__', this, false)
    
    // 检查value 是不是 数组
    if (Array.isArray(value)) {
      // 如果value是数组， 把value的原型，指向 arrayMethods(push等7个方法 被 改写过)
      Object.setPrototypeOf(value, arrayMethods) // 或者用 value.__proto__ = arrayMethods
      // 数组 实现响应式
      this.observeArray(value)

    } else {
      // 对象 直接 调用walk 方法  转换 为响应式
      this.walk(value)
    }
  }
  // 遍历 value对象上的每一个 属性，并且 调用 defineReactive方法 转换为响应式
  walk (value) {
    for (let k in value) {
      defineReactive(value, k)
    }
  }

  // 数组的特殊遍历
  observeArray (arr) {
    for (let i = 0, l = arr.length; i < l; i++) { 
      // 逐项进行observe
      observe(arr[i])
    }

  }
}