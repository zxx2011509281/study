
import observe from './Observe.js'


// 包裹 Object.defineProperty， 把 对象上的属性  转换为响应式
// （为什么要包裹？ 因为：如果key为常量的时，get返回值永远是一个值。包裹之后才能 修改）； 
export default function defineReactive (data, key, val) {
  // 如果值传入两个参数 ，那么 val 就是  对象对应的值
  if(arguments.length===2){
    val = data[key]
  }

  //如果val 是对象，对象上的属性也要变化动态的。如果不是对象(常数、undefined等)，observe函数里面不会处理
  // 子元素也要 observe； （observe,observer,defineReactive三个函数相互调用，形成了类似递归的效果）
  let chilOb = observe(val)

  Object.defineProperty(data, key, {
    enumerable: true, //可以被枚举
    configurable: true, // 该属性的描述符能被改变，能被删除
    // 访问的时候触发 get函数
    get () {
      // console.log('触发getter');
      return val
    },
    // 修改的时候触发 set 函数
    set (newValue) {
      // console.log('触发setter', newValue);
      if (val === newValue) return;
      val = newValue

      // 当设置 新值的时候也要调用  observe 方法把 新值（如果是对象）转换为响应式
      chilOb = observe(newValue)
    }
  })
}