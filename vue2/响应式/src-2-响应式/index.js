import defineReactive from './defineReactive.js'
import observe from './Observe.js'
import Watcher from './Watcher.js'
window.obj = {
  // a: {
  //   m: {
  //     n: 999
  //   }
  // },
  // b: 4,
  g: [1,2,3,4]
}



observe(obj)
new Watcher(obj, 'g', (newVal, oldVal)=>{
  console.log('watch', newVal, oldVal);
})
obj.g.push(5)
// obj.g=3
// new Watcher(obj, 'a.m.n', (newValue, oldValue)=>{
//   console.log('**************', newValue, oldValue);
//   // 去更新页面上 {{a.m.n}}
// })
// obj.a.m.n = 198

// console.log('aaaaaaaaaaaaaa', a);
// obj.a.m.n = 44
// // obj.g.splice(2,1,66,77,88)
// obj.g.push({"test": 6})
// console.log('obj', obj);


// 先不说依赖 和 watch  Dep类 和 watcher类

//1. 入口 observe 会先查看 对象有没有 __ob__ 的属性，如果没有的话，并且 实例化Observer方法(方法会把__ob__属性挂载到对象上)。

//2. Observer 会遍历下一层属性， 逐个调用 defineReactive方法， 转换属性为响应式。  Observer 会把 __ob__ 属性 挂载到对象上。  (如果是属性对应的值是数组，会把数组的方法改写，以便掉数组的push,pop等方法也会触发响应式)

//3. defineReactive方法, 会把对象 上的属性转换为 响应式。 如果属性 的值(或者 修改后的值) 又是 一个对象的话，又会调用 observe方法 重新 走一遍1，2，3 把对应值的属性转换为响应式。 并且 属性值是对象 会返回 Observer的实例，实例上有一个dep，就可以用来收集数组依赖


// Dep 类 把所有依赖收集到一起， 专门用来管理依赖的类。  每一个Observer的实例 ，成员都有一个Dep的实例， 用来收集数组的依赖
// Watcher是一个中介， 数据发生改变的时候， 通过Watcher中转，通知组件。
// 在getter 中收集依赖， 在setter中 触发依赖 (其中每一个依赖 其实就是 watcher)
// 代码的巧妙之处是： watcher 把自己设置到一个全局位置（Dep类的身上，Dep类只有一个，当然也可以设置到window上只要唯一就行）,当读取数据是，触发这个数据的 getter，getter中 获取正在读取数据的wathcer(依赖)，把这个watcher手机到Dep中
// Dep 使用发布订阅模式，只有有数据变化，就把依赖列表(收集了很多依赖)，循环通知一遍。