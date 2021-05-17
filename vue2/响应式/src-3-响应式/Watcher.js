import Dep from './Dep'
import { traverse } from './traverse'

// 监听对象 的表示式  触发回调
// vm.$watch('a.b.c.d', ()=>{})   a.b.c.d是下面的表达式
var uid = 0;
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

    // ****************new add 订阅的dep 
    this.deps = []
    // ****************new add 订阅dep的 id 列表
    this.depIds = new Set()

    // 获取 表达式 解析后的函数
    if(typeof expOrFn === 'function'){
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
    }
    // 回调
    this.callback = callback;
    // 获取 Watcher 实例的 值
    this.value = this.get()
  }
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
  // ********************new add 从所有依赖项的 Dep列表中 将自己移除
  teardown(){
    let i = this.deps.length
    while(i--){
      this.deps[i].removeSub(this)
    }
  }

  // 更新
  update () {
    this.getAndInvoke(this.callback)
  }
  // 得到并唤起
  getAndInvoke (cb) {
    const value = this.get()

    // 如果更新后 到的值不是 当前的值 或者 是一个对象  。 那么更新value 并执行回调 
    if (value !== this.value || typeof value == 'object') {
      const oldValue = this.value;
      this.value = value
      cb.call(this, value, oldValue)
    }
  }
  // 获取
  get () {
    console.log('进入wathcer');
    // 进入依赖收集 阶段 （把watcher 设置全局唯一位置，以便Dep收集 当前的watcher实例）
    Dep.target = this;

    const obj = this.target

    // 获取 对象中表示式 对应的值
    let value;
    // 只要能找，就一直找
    try {
      // obj对象 在watcher 实例之前 就已经observe了。 (此时要获取值，就会触发 getter方法)
      // 所以这个时候 调用this.getter(obj) 会触发 defineReactive 的getter方法 。
      // getter方法中 判断 如果 Dep.target存在（此时存在了，就是这个Watcher实例），就会收集 watcher实例到 dep中
      value = this.getter(obj)

      // ************** new add 递归收集依赖
      if(this.deep){
        traverse(value)
      }
    } finally {
      // get结束后 ，说明读结束了。要把全局位置 让出来
      Dep.target = null;
    }
    console.log('进入wathcer-end', Dep.target);
    return value
  }
}

// 把a.b.c.d 处理 返回一个函数  调用返回的函数 可以获取 函数的值 
// 比如   var fn = parsePath('a.b.c.d')  ;  fn({a:{b:{c:{d:88}}}}) 获取 88
function parsePath (str) {
  var list = str.split('.')
  return (obj) => {
    if (!obj) return;
    for (let i = 0; i < list.length; i++) {
      obj = obj[list[i]]
    }
    return obj
  }
}
