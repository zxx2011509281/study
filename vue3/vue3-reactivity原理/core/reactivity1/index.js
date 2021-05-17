
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
    return this._val
  }
  set value (newVal) {
    this._val = newVal
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

const dep = new Dep(2)

// 配合收集 依赖
function effectWatch (effect) {

  // 把effect 依赖 存到 环境变量中
  currentEffect = effect
  // 一上来就先调用一次
  effect()
  dep.depend()
  // 最后 环境变量置空
  currentEffect = null

}


let b;
effectWatch(() => {
  b = dep.value + 10
  console.log('b', b);
})

// 值变更
dep.value = 20
// 通知更新
dep.notice()