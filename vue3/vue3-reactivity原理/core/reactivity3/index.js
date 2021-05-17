
// 响应式库

// 设置一个环境变量 
let currentEffect;

// 依赖 一个类
class Dep {
  constructor(val) {
    this.effects = new Set() // 依赖不能重复收集（Set实现,  集合数据结构 集合是由一种没有重复元素且没有顺序的数组）

    this._val = val
  }
  get value () {
    //*********************** */ 收集依赖
    this.depend()
    return this._val
  }
  set value (newVal) {
    this._val = newVal
    //*********************** 值更新完成之后再去 触发依赖
    this.notice()
  }

  // 1. 收集依赖
  depend () {

    // 判断是否存在环境变量
    if (currentEffect) {
      this.effects.add(currentEffect)
    }

  }
  // 2. 触发依赖
  notice () {
    this.effects.forEach(effect => effect())
  }
}

// 配合收集 依赖
function effectWatch (effect) {

  // 把effect 依赖 存到 环境变量中
  currentEffect = effect
  // 一上来就先调用一次
  effect()
  //*********************** dep.depend()
  // 最后 环境变量置空
  currentEffect = null

}




//  现在 还是 dep -> number  string
// 实现 object -> key -> dep  （对象的每一个key用dep管理起来）

// 1.这个对象在什么时候改变
//  object.a --> get   object.a =2 --->set


// vue2  Object.defineProperty
// Object.defineProperty的第一个缺陷,无法监听数组变化（vue2改写了数组的七个方法 push,pop等）
// bject.defineProperty的第二个缺陷,只能劫持对象的属性,因此我们需要对每个对象的每个属性进行遍历（深度遍历）


// vue3 proxy
// 1. Proxy可以直接监听对象而非属性，并返回一个新对象
// 2. Proxy可以直接监听数组的变化


// 一个全局的Map保存 dep
// {
//   target:{
//     key: [effect1, effect2]
//   }
// }
const targetMap = new Map()

function getDep (target, key) {
  let depsMap = targetMap.get(target)

  // 如果不存在 target对象的Map那么保存起来
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)

  // 如果不存在 key对应的dep, 也保存起来
  if (!dep) {
    dep = new Dep()
    depsMap.set(key, dep)
  }
  // 返回dep
  return dep
}

function reactive (raw) {
  return new Proxy(raw, {
    get (target, key) {
      console.log('触发get钩子', target, key);
      // key 对应一个 dep
      // dep  存储在 哪里  

      const dep = getDep(target, key)

      // dep 收集依赖
      dep.depend() // vue3 track

      // return target[key]  Object 的一些明显属于语言内部的方法移植到了 Reflect 对象上
      return Reflect.get(target, key)
    },
    set (target, key, value) {
      console.log('触发set钩子');
      // 触发依赖
      const dep = getDep(target, key)

      const result = Reflect.set(target, key, value)

      dep.notice(); // vue3 trigger

      // 为什么要return 数组是需要返回值的
      return result
    }
  })
}

// const user = reactive({
//   age: 20
// })

// effectWatch(() => {
//   let b = user.age+10;
//   console.log('bbbb',b);
// })
// user.age=30

// const list = reactive([1, 2])
// effectWatch(() => {

//   let length = list.length
//   console.log('hhhhhh', length);
// })
// list.push(3)




module.exports = {effect: effectWatch , reactive}