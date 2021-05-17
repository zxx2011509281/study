### 为啥要有响应式 

比如我变量a = 2;
然后要让变量b = a +10;
a变化的时候 b 也要变化。如果没有响应式那么要自己调用更新
```
let a = 2;
let b;

function update(){
  b = a + 10
  console.log('b', b);
}

update()
a=20
update()

```
这样就很不友好了。vue3提供了reactivity API。我们可以直接下 `npm i 
 @vue/reactivity`

然后就可以这么写了
```
const { reactive, effect } = require('@vue/reactivity')

let a = reactive({ value: 2 })
let b;

effect(() => {
  b = a.value + 10
  console.log('b', b);
})

a.value = 20

```

现在就实现了响应式 ，a的value值变化， b也会自动变化了。

### 实现简陋的reactivity

1. 我们需要一个Dep类，这个类用来收集和触发依赖
2. 然后我们需要一个effectWatch函数， 用来配置Dep类似收集，effectWatch函数就类似于vue3的effect

**实现原理**
effectWatch 一上来就是执行自己内部函数， 就会触发 变量 a的get访问，而再 Dep中实现，get返回会触发收集依赖(当前的内部函数)。

然后修改变量a ，触发set。又会触发依赖(收集的effectWatch的内部函数执行)

为了让effectWatch与Dep类收集到正确的依赖，会有一个全局变量currentEffect来作为中转收集（vue2中是直接放到Dep类的target属性上）

```
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

//  类似于 a = 2
const dep = new Dep(2)

let b;

effectWatch(() => {
  b = dep.value + 10
  console.log('b', b);
})

// 值变更
dep.value = 20
```

### 实现vue3的proxy
Dep目前只能监听string，number类型，现在实现对对象的监听

我们传入一个对象object, 在访问object.a的时候会触发get方法， 给object.a = 2 赋值的时候会触发 set方法

**vue2 Object.defineProperty与 vue3 proxy 对比**
1. `Object.defineProperty的第一个缺陷,无法监听数组变化（vue2改写了数组的七个方法 push,pop等）`
2. `bject.defineProperty的第二个缺陷,只能劫持对象的属性,因此我们需要对每个对象的每个属性进行遍历（深度遍历）`

3. `Proxy可以直接监听对象而非属性，并返回一个新对象`
4. `Proxy可以直接监听数组的变化`

ok，下面我们用 reactive 方法实现
关于 Proxy 与 Reflect 网上有很多了，这里就不概述了


reactive 传入一个对象，在get、set的时候都要调用getDep获取当前的dep。（如果不存在就会调用 Dep类然后保存起来）
```
function reactive (raw) {
  return new Proxy(raw, {
    get (target, key) {
      console.log('触发get钩子', key);
      // key 对应一个 dep
      // dep  存储在 哪里  

      const dep = getDep(target, key)

      // dep 收集依赖
      dep.depend()

      // return target[key]  Object 的一些明显属于语言内部的方法移植到了 Reflect 对象上
      return Reflect.get(target, key)
    },
    set (target, key, value) {
      console.log('触发set钩子');
      // 触发依赖
      const dep = getDep(target, key)

      const result = Reflect.set(target, key, value)

      dep.notice();

      // 为什么要return 数组是需要返回值的
      return result
    }
  })
}
```

实现getDep方法
```
// 一个全局的Map保存 dep
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
  // 方法dep
  return dep
}
```

我理解的是proxy 中 Reflect.get,Reflect.set在实现原来对象的方法的同时，dep.depend，dep.notice 也同时完成了自己想要的动态响应需求。
只要用proxy代理的对象之后，对象的值的方法和触发都会进入get或者set方法中，那么就会触发我们的依赖收集和触发

下面是完整代码。
```

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

// 一个全局的Map保存 dep
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
  // 方法dep
  return dep
}

function reactive (raw) {
  return new Proxy(raw, {
    get (target, key) {
      console.log('触发get钩子', key);
      // key 对应一个 dep
      // dep  存储在 哪里  

      const dep = getDep(target, key)

      // dep 收集依赖
      dep.depend()

      // return target[key]  Object 的一些明显属于语言内部的方法移植到了 Reflect 对象上
      return Reflect.get(target, key)
    },
    set (target, key, value) {
      console.log('触发set钩子');
      // 触发依赖
      const dep = getDep(target, key)

      const result = Reflect.set(target, key, value)

      dep.notice();

      // 为什么要return 数组是需要返回值的
      return result
    }
  })
}

module.exports = {effect: effectWatch , reactive}
```

然后我们再indx.js中引入我们自己写的方法
```
const {effect , reactive} = require('./core/reactivity3/index.js')

let a = reactive({ value: 2 })
let b;

effect(() => {
  b = a.value + 10
  console.log('b', b);
})

a.value = 20
```


#### 新增 上面还是用到了 vue2 中的Dep，下面我们精简vue3实现
```
let targetMap = new WeakMap()
let effectStack = [] //存储 effect 副作用

// 拦截的 get set
const baseHandler = {
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

function reactive (target) {
  const observed = new Proxy(target, baseHandler)

  return observed
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

function effect (fn, options = {}) {
  let e = createReactiveEffect(fn, options)
  // 不是懒执行 那么初始化就执行一次
  if (!options.lazy) {
    e()
  }
  return e
}

function createReactiveEffect (fn, options) {
  const effect = function effect(...args){
    return run(effect, fn, args)
  }

  // 函数上挂载 属性
  effect.deps = []
  effect.computed = options.computed
  effect.lazy = options.lazy

  return effect
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
```

computed 不会一上来就执行 副作用 ，要等到 调用获取返回值的时候才会执行

```
const {effect , reactive, computed} = require('./core/reactivity4/index.js')

let a = reactive({ value: 2 })
let b;

// 不会执行副作用  只有等 访问的时候 执行track 和trigger
const comp = computed(() => a.value * 100)
// const c = a.value *2
// const comp = { value: a.value * 100 }

// 执行副作用  就会触发 track 访问 收集依赖， 改变的时候 就会触发依赖
effect(() => {
  b = a.value + 10
  console.log('b', b);
  console.log('comp', comp.value);
})


// console.log('comp1', comp.value); // 200
// console.log('c', c); // 4
a.value = 20
// console.log('comp1', comp.value); // 2000
// console.log('c', c); // 4
```




