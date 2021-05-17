var uid = 0;
// Dep 类收集 依赖 然后 触发依赖更新 （其中每一个依赖都是Watcher实例）
export default class Dep {
  constructor() {
    this.id = uid++;
    // 存储自己的订阅者(收集的watcher实例)。
    this.subs = []
  }

  // 添加订阅
  addSub (sub) {
    this.subs.push(sub)
  }

  // 添加依赖
  depend(){
    // Dep.target 自定义的一个全局唯一位置。也可以用window.__myOnly__随便啥都行；
    // Dep.target 上是正在读取数据的watcher, 之后会重置为null;
    console.log('depend', Dep.target);
    if(Dep.target){
      this.addSub(Dep.target)
    }
  }

  // 触发依赖 通知更新
  notify () {
    // 浅克隆
    const subs = this.subs.slice();
    // 遍历
    for (let i = 0, l = subs.length; i < l; i++) {
      // 每一个 watcher 调用 update更新方法
      subs[i].update()
    }
  }

}