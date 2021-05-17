import Dep from './Dep'

// 监听对象 的表示式  触发回调
// vm.$watch('a.b.c.d', ()=>{})   a.b.c.d是下面的表达式
var uid = 0;
export default class Watcher {
  constructor(target, expressiong, callback) {
    this.id = uid++;
    // 需要监听的对象 
    this.target = target;
    // 获取 表达式 解析后的函数
    this.getter = parsePath(expressiong)
    // 回调
    this.callback = callback;
    // 获取 Watcher 实例的 值
    this.value = this.get()
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
