import defineReactive from './defineReactive.js'
import observe from './Observe.js'
var obj = {
  a: {
    m: {
      n: 999
    }
  },
  b: 4,
  g: [1,2,3,4]
}



observe(obj)
// obj.g.splice(2,1,66,77,88)
obj.g.push({"test": 6})
console.log('obj', obj.g);



//1. 入口 observe 会先查看 对象有没有 __ob__ 的属性，如果没有的话，并且 实例化Observer方法(方法会把__ob__属性挂载到对象上)。

//2. Observer 会遍历下一层属性， 逐个调用 defineReactive方法， 转换属性为响应式。  Observer 会把 __ob__ 属性 挂载到对象上。  (如果是属性对应的值是数组，会把数组的方法改写，以便【属性如果是对象】实现响应式)

//3. defineReactive方法, 会把对象 上的属性转换为 响应式。 如果属性 的值(或者 修改后的值) 又是 一个对象的话，又会调用 observe方法 重新 走一遍1，2，3 把对应值的属性转换为响应式；

// 4. 