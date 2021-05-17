let targetMap = new WeakMap()
let effectStack = [] //存储 effect 副作用

function reactive (target) {
  const observed = new Proxy(target, baseHandler)

  return observed
}

// 拦截的 get set
var baseHandler = {
  get (target, key) {
    const ret = target[key]// Reflect.get(target, key)

    // 收集依赖 到全局map targetMap
    track(target, key)

    return ret // 如果有递归  typeof ret === 'object' ? reactive(ret): ret;
  },
  set (target, key, value) {
    // 获取 新老值
    const info = { oldValue: target[key], newValue: value }

    target[key] = value // Reflect.set(target, key, value)

    // 拿到收集的 effect ，并执行
    trigger(target, key, info)
  }
}





// 收集依赖
function track (target, key) {
  //初始化
  const effect = effectStack[effectStack.length - 1]

  if (effect) {
    // 初始化
    let depsMap = targetMap.get(target)
    if (depsMap === undefined) {
      depsMap = new Map()
      targetMap.set(target, depsMap)
    }

    let dep = depsMap.get(key)
    if (dep === undefined) {
      dep = new Set() // 防止 重复
      depsMap.set(key, dep)
    }

    // 收集
    if (!dep.has(effect)) {
      dep.add(effect) // 把effect 放到dep 里面 封存
      effect.deps.push(dep) // 双向缓存
    }
  }
}

// 触发依赖
function trigger (target, key, info) {
  let depsMap = targetMap.get(target)
  // 如果没有副作用
  if (depsMap === undefined) {
    return
  }

  const effects = new Set()

  const computeds = new Set() // 一个特殊的effect  懒执行

  // 存储
  if (key) {
    let deps = depsMap.get(key)
    // 可能有多个副作用 effect
    deps.forEach(effect => {
      // 如果有计算 属性
      if (effect.computed) {
        computeds.add(effect)
      } else {
        effects.add(effect)
      }
    })
  }

  //  执行
  effects.forEach(effect => effect())
  computeds.forEach(computed => computed())
}


function computed (fn) {
  const runner = effect(fn, { computed: true, lazy: true }) // 懒执行，开始的时候不用初始执行
  
  return {
    effect: runner,
    get value () {
      return runner()
    }
  }
}

//  effect fn是传入的要执行的函数
function effect (fn, options = {}) {
  
  let e = createReactiveEffect(fn, options)
  // 不是懒执行 那么初始化就执行一次
  if (!options.lazy) {
    e()
  }
  return e
}

function createReactiveEffect (fn, options) {
  function effectx(...args){
    return run(effectx, fn, args)
  }

  // 函数上挂载 属性
  effectx.deps = [] //保存  effect副作用
  effectx.computed = options.computed // 是否是计算属性
  effectx.lazy = options.lazy // 是否 首次执行

  return effectx
}

// 真正执行  调度
function run(effect, fn, args){
  //  不存在
  if(effectStack.indexOf(effect) === -1){
    try{
      //  把副作用 存储到 effectStack 中
      effectStack.push(effect)
      return fn(...args)
    }finally{
      //  最后 把执行后的副作用  pop掉
      effectStack.pop()
    }    
  }
}


module.exports = {effect , reactive, computed}
