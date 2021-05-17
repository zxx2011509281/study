###vm.$watch实现
语法： vm.$watch(expOrFn, callback, [options])=> 返回 function

参数：
 * {string | Function} expOrFn
* {Function | Object} callback
* {Object} options
  *  {Boolean} deep
  * {Boolean} immediate
返回值： {Function } unwatch


返回值 unwatch 执行 可以停止监听
参数 ： 
  deep 为 true 是为了深层次 监听 对象的变化（数组的变动i不需要）
  immediate 为 true 将立即执行回调


vue2-数据响应式原理(一)[https://www.jianshu.com/p/510eec216e83]
中的 Watcher类可以用来实现 vm.$watch功能

```
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
```
由于expOrFn 可能是 函数，所有 前面的Watcher 类需要增加是函数的判断
Watcher.js
```
export default class Watcher {
  constructor(target, expOrFn, callback) {
    this.id = uid++;
    // 需要监听的对象 
    this.target = target;
    // 获取 表达式 解析后的函数
    //************** new add
    if(typeof expOrFn === 'function'){
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
    }
```

当 expOrFn 是函数的时候， 不止可以动态返回数据， 其中读取的 所有数据也会被Watcher观察。

执行 new Watcher后，代码会判断是有使用了 Immediate参数，如果使用了，则立即执行回调函数；

最后会返回一个 unwatchFn的函数，作用是用来取消观察数据。
实际上是执行了watcher.teardown()来取消观察数据。
我们要取消观察数据，那么就需要在Watcher中记录订阅了谁， 也就是`watcher实例被收录进那些dep中`, 当要取消订阅的时候，循环 自己记录的订阅列表来 通知 收录了自己的 dep 把 自己从 依赖列表 给移除掉；

改动点：
 在Watcher内 添加 addDep方法，用来记录自己都订阅过那些dep;
```
var uid = 0;
export default class Watcher {
  constructor(target, expOrFn, callback) {
    this.id = uid++;
    // 需要监听的对象 
    this.target = target;

    // ****************new add 订阅的dep 
    this.deps = []
    // ****************new add 订阅dep的 id 列表
    this.depIds = new Set()

*****
  // ****************new add  收集订阅过的dep
  addDep(dep){
    const id = dep.id
    // 如果没有被收集过， 那么收集
    if(!this.depIds.has(id)){
      this.depIds.add(id)
      this.deps.push(dep)
      // Dep类 中 depend 中的 添加依赖
      dep.addSub(this)
    }
  }
```
Dep.js修改
```
export default class Dep {
  constructor() {
    this.id = uid++;
    // 存储自己的订阅者(收集的watcher实例)。
    this.subs = []
  }

  // 添加订阅
  addSub(sub) {
    this.subs.push(sub)
  }

  // 添加依赖
  depend() {
    // Dep.target 自定义的一个全局唯一位置。也可以用window.__myOnly__随便啥都行；
    // Dep.target 上是正在读取数据的watcher, 之后会重置为null;
    if (Dep.target) {
      //*************new delete 删除 this.addSub(Dep.target)
      //*************** new add
      Dep.target.addDep(this)
    }
  }
```

这样改过之后，Watcher 触发自身的get 方法把 自己设置为Dep.target。当访问 调用 this.getter 访问表达式里面 的具体值的时候，
会触发响应式数据的 dep.depend方法 收集依赖。
此时 不是直接收集依赖了。
需要 调用  Dep.target(当前的Watcher实例) 的 addDep 方法， 并且把 当前 的dep 传入（以便于真正的收集依赖）
在Watcher中 addDep方法会 记录   自身订阅过的dep。
最后触发 dep.addSub(this) 来将自身 收集到Dep 中。


**expOrFn为一个表达式时， 会收集多个数据**，这时 Watcher 就要记录多个Dep了比如：
```
this.$watch(function(){
  return this.name + this.age + this.sex
}, function(newValue, oldValue){
  console.log(newValue, oldValue)
})

```
这里就会收集三个Dep。 同时这个三个Dep也会收集当前这个Watcher。

ok,继续。我们要实现的是teardown方法 ，取消订阅
在Watcher类中增加方法
Watcher.js
```
export default class Watcher {
****
  // ********************new add 从所有依赖项的 Dep列表中 将自己移除
  teardown(){
    let i = this.deps.length
    while(i--){
      this.deps[i].removeSub(this)
    }
  }

```
Dep.js
```
export default class Dep {
****
  // 移除依赖
  removeSub(sub){
    const index = this.subs.indexOf(sub)
    if(index > -1){
      return this.subs.splice(index, 1)
    }
  }

```

#### deep 参数的实现
deep的功能其实就是除了要触发当前这个被监听数据的 收集依赖的逻辑之外，还要把当前监听 的这个值 内 的所有子值 都触发一遍 收集依赖逻辑。
Watcher内 要判断 是否有 deep参数， 然后在 get函数中 判断如果有deep，这要调用  traverse函数来递归所有子值 来触发它们 收集依赖

Watcher.js
```
import { traverse } from './traverse'
export default class Watcher {
  // ********new add 增加options 参数
  constructor(target, expOrFn, callback, options) {
    this.id = uid++;
    // 需要监听的对象 
    this.target = target;
    //********** */ new add 默认 deep为false
    if(options){
      this.deep = !!options.depp
    } else {
      this.deep = false
    }
    ***
}
get () {
    ***
    try {
      value = this.getter(obj)

      // ************** new add 递归收集依赖
      if(this.deep){
        traverse(value)
      }
    } finally {
      // get结束后 ，说明读结束了。要把全局位置 让出来
      Dep.target = null;
    }
```

新建一个traverse.js

```
const seenObjects = new Set()

export function traverse (val) {
  _traverse(val, seenObjects)
  seenObjects.clear()
}

function _traverse (val, seen) {
  let i, keys
  const isA = Array.isArray(val)
  // 如果不是 数组和对象 ，或者已经被冻结，那么直接返回
  if ((!isA && !isObject(val)) || Object.isFrozen(val)) {
    return
  }
  // 如果当前值有__ob__ 说明当前值是 被observer 转换过的响应式数据
  if (val.__ob__) {
    // 获取dep.id  保证不会重复收集依赖
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }

  if (isA) {
    // 如果是 数组 循环数组中的 每一项 递归调用_traverse
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else {
    // 重点
    // 如果 是 对象，循环对象中 所有的key,然后执行 读取操作val[kyes[i]], 再递归调用_traverse
    // 读取操作会触发getter，即 触发收集依赖的操作。 此时 Dep.target还没有被清空
    // 这时会 把当前的 Watcher实例 收集进去。
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }
}
```
traverse函数就是用递归调用自身，遍历watcher中要监听的value值。然后再traverse中 会触发 getter操作，然后会把当前 的watcher实例 作为依赖收集进去。

