
import observe from './Observe.js'
import Dep from './Dep.js'
import { dependArray } from './array.js'


// 包裹 Object.defineProperty， 把 对象上的属性  转换为响应式
// （为什么要包裹？ 因为：如果key为常量的时，get返回值永远是一个值。包裹之后才能 修改）； 
export default function defineReactive (data, key, val) {
  // *new add* 获取Dep 的实例 便于收集和触发依赖 
  // *new add* 每一个 对象监听的 属性，都需要一个 dep 收集依赖
  // *new add* 数组的依赖 需要到 Observer上的一个dep上 ，下面的
  const dep = new Dep()


  // 如果值传入两个参数 ，那么 val 就是  对象对应的值
  if (arguments.length === 2) {
    val = data[key]
  }

  // *new add* 如果val 是对象，对象上的属性也要变化动态的。如果不是对象(常数、undefined等)，observe函数里面不会处理
  // *new add* 子元素也要 observe； （observe,observer,defineReactive三个函数相互调用，形成了类似递归的效果）
  // *new add* observe 返回 Observer的实例， 实例上有 收集数组 的dep 
  let chilOb = observe(val)

  Object.defineProperty(data, key, {
    enumerable: true, //可以被枚举
    configurable: true, // 该属性的描述符能被改变，能被删除
    // 访问的时候触发 get函数
    get () {
      // *new add*  如果处于依赖收集阶段, 那么就收集依赖
      if (Dep.target) {
        dep.depend()
        // 如果子元素 存在的话， 也要收集依赖
        if (chilOb) {
          chilOb.dep.depend() // *new add* 数组收集当前渲染的watcher
          dependArray(val) // *new add* 收集儿子的依赖
        }
      }
      return val
    },
    // 修改的时候触发 set 函数
    set (newValue) {
      if (val === newValue) return;
      val = newValue

      // 当设置 新值的时候也要调用  observe 方法把 新值（如果是对象）转换为响应式
      chilOb = observe(newValue)

      // *new add*  这里是对象 改变 触发依赖 通知 dep
      // data.__ob__.notify()
      dep.notify()
    }
  })
}