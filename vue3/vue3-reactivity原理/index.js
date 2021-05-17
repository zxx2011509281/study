// 为啥要有响应式 
// let a = 2;
// let b;

// function update(){
//   b = a + 10
//   console.log('b', b);
// }

// update()
// a=20
// update()


// 用vue3 的reactivity 实现响应式
// const { reactive, effect } = require('@vue/reactivity')

// let a = reactive({ value: 2 })
// let b;

// effect(() => {
//   b = a.value + 10
//   console.log('b', b);
// })

// a.value = 20


// 用自己写的 
// const {effect , reactive} = require('./core/reactivity3/index.js')

// let a = reactive({ value: 2 })
// let b;

// effect(() => {
//   b = a.value + 10
//   console.log('b', b);
// })

// a.value = 20





const {effect , reactive, computed} = require('./core/reactivity4/index.js')

let a = reactive({ value: 2 })
let b;

// 不会执行副作用  只有等 访问的时候 执行track 和trigger
const comp = computed(() => a.value * 100)


// 执行副作用  就会触发 track 访问 收集依赖， 改变的时候 就会触发依赖
effect(() => {
  b = a.value + 10
  console.log('b', b);
  // console.log('comp', comp.value);
})


// console.log('comp1', comp.value);
a.value = 20
// console.log('comp1', comp.value);
