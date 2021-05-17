import { def } from './util.js'
import defineReactive from './defineReactive.js'
import { arrayMethods } from './array.js'
import observe from './Observe.js'
import Dep from './Dep.js'


// 把对象 转换 成 每个层级的属性 都是响应式的对象(可以被侦测)； 比如： obj:{a:{b:{c: 5}}}
export default class Observer {
  constructor(value) {
    // *new add* 每一个Observer的实例身上，都有一个Dep(也就是说__ob__上会有 dep). 目的是挂载上dep
    //  *new add* 每一个 Observer 实例上会有 dep 用来收集  数组 的依赖 
    //  *new add* 在对对象调用 defineReactive 实现依赖收集时，如果 对象上 某一项是 数组或对象，就会 收集依赖 到 这个 dep上
    //  以便于 没有触发 defineReactive 的 set 方法中 dep.notify()，我们可以 使用 Observer 实例上的 __ob__ 上的 另一个 dep 触发 notify
    //  Observer实例上的 dep 和 Observer实例上(对象）上 某一项 obj[key] 中 key 的 dep 收集的是同一个依赖。所有 修改 obj[key] 或者 调用 数组的push等等触发的 __ob__.dep.notify 都会 通知依赖更新
    /**
     比如： 
      obj1={list1: [1,2,3]}  => 

      Observe(obj1) ；=> 

      生成Observer实例  obj1_Observer = new Observer(obj1) => 

      实例 生成一个Dep实例 dep1  obj1_Observer__ob__dep1 

      然后 对 obj1.list1 调用 defineReactive(obj1, list1)

      会生成一个新的Dep 实例 dep2 (监听 obj1.list1的修改)
      
      同时  obj1.list1对应的 [1,2,3] 是一个数组或对象 
      又会调用 observe([1,2,3]) 
      返回一个新的 Observer实例 observer2 

      observer2 上又会产生一个 新的Dep实例 dep3  observer2__ob__dep3

      当在 在 get 访问中 访问 obj1.list1时， 会收集 dep2的依赖，并且收集dep3。（由于访问都是又Watcher触发的，所有收集的都是相同的依赖）

      当修改对象 的具体 数值的时候， 会触发 defineReactive中的set 方法， 然后 set 方法 可以访问 到 dep2， 所有调用dep2.notify触发依赖更新
      
      由于数组的更改比如push,shift,splice等无法触发 defineReactive中的set 方法 。我们  修改 了 Observer实例 observer2  中的 数组 方法。  
      当调用数组修改后 的方法时，我们 就调用  Observer实例 observer2 上的 observer2__ob__dep3   dep3.notify 触发依赖 更新


      总结来说。我们对 对象 某一项 转换为响应式的 时候，不仅仅 收集 可以通过defeineProperty修改某一项的 依赖； 还留一个口， 用来无法通过 defeineProperty监听的数据，我们通过其他方法 收集依赖
      比如上面我们通过 修改 obj1.list1 = 2 可以触发 dep2 更新依赖
      通过 obj1.list1.push(3) 可以触发 dep3 更新依赖
      而依赖都是同一个 Watcher 。所有都是处理 同一个事件，比如更新模板

     * **/
    this.dep = new Dep()

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
  walk(value) {
    for (let k in value) {
      defineReactive(value, k)
    }
  }

  // 数组的特殊遍历 （数组的每一项都要调用 转换为响应式 ,可能数组里面也有数组或对象）
  observeArray(arr) {
    for (let i = 0, l = arr.length; i < l; i++) {
      // 逐项进行observe
      observe(arr[i])
    }
  }
}

// 添加 set方法
export function set(target, key, val) {

  // 如果 是数组，并且key 是有效的索引值
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 获取数组的最长的长度 ，有可能是 修改 list某一项，有可能是新增某一项
    target.length = Math.max(target.length, key)
    // 数组的 splice方法已经被侦测，索引调用splice方法会 自动触发依赖更新
    target.splice(key, 1, val)
    return val
  }
  // key已经存在 target中。那么key本来就是响应式的，这里只需要修改值就行
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }

  // 获取 target的__ob__属性
  const ob = target.__ob__
  // 如果 是 VUe.js实例 或者 是根数据对象 直接返回并 不是生产环境警告
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果没有 __ob__，那么 target不是响应式的，直接修改返回（前提是响应式对象新增值才能变为响应式）
  if (!ob) {
    target[key] = val
    return val
  }
  // 给 target__ob__value 就是自己， 把新增 属性转换为响应式
  defineReactive(ob.value, key, val)
  // 通知 依赖更新
  ob.dep.notify()
  return val
}

// 添加delete方法
export function del (target, key) {
  // 如果是数组，切key是下有效的
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 直接 删除就行  如果target 是响应式的，那么splice方法会自动触发依赖更新
    target.splice(key, 1)
    return
  }
  // 获取 __ob__
  const ob = target.__ob__
  // 判断 target 不能是Vue实例 且 不能是 Vue实例 的根属性对象
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  // 如果key 不是target自身的属性， 停止程序继续执行
  if (!hasOwn(target, key)) {
    return
  }
  //  删除对象 上的 key值
  delete target[key]
  // 如果不是响应式 对象 直接返回
  if (!ob) {
    return
  }
  // 响应式对象的话 ，通知依赖更新
  ob.dep.notify()
}