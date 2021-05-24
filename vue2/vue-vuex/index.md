https://www.jianshu.com/p/f7efe97bc822 建议先看vue2-router的实现原理

Vuex 是一个专为 Vue.js 应用程序开发的状态管理模式。它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化

vuex的使用
* 创建store
```
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    count: 1
  },
  mutations: {
    increment(state) {
      state.count++
    }
  },
  actions: {
    increment(context) {
      setTimeout(() => {
        context.commit('increment')
      }, 500);
    }
  },
  modules: {
  }
})

```
* 在跟组件上添加实例 main.js
```
import Vue from 'vue'
import App from './App.vue'
import store from './store'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
  store
}).$mount('#app')

```

在App.vue中使用
```
<template>
  <div id="app">
    <div @click="$store.commit('increment')">{{$store.state.count}}</div>
    <div @click="$store.dispatch('increment')">{{$store.state.count}}</div>
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
  #app{
    text-align: center;
  }
</style>

```

我们创建一个my-router.js

由于在 store/index.js中  Vue.use(Vuex) 所有要有暴露 install方法 ，然后 export default new Vuex.Store() . 所有我们还需要暴露出Store 方法
```
// 实现一个插件 install
// 实现存储状态

let Vue
class Store{

}
function install(_Vue){
  Vue = _Vue
}

export default { Store, install}
```

![image.png](https://upload-images.jianshu.io/upload_images/4642829-b673951310a6eb8c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

页面报错，继续解决
先注册$store
```
function install(_Vue){
  Vue = _Vue
  // 注册$store
  Vue.mixin({
    beforeCreate(){
      if(this.$options.store){
        Vue.prototype.$store = this.$options.store
      }
    }
  })
}
```
接下来 把options里面的state 转换为响应式的
```
class Store {
  constructor(options) {
    // 响应式处理的数据
    // 第一种 Vue.util.definReactive
    // this.state = {}
    // for(let i in options.state ){
    //   const item = options.state[i]
    //   Vue.util.defineReactive(this.state, i, item)
    // }    
    // 第二中 newVue
    this.state = new Vue({
      data: options.state
    })
    setTimeout(() => {
      this.state.count++
    }, 1000);
  }
}
```
我们采用new Vue的方式，但是又不想暴露vue实例的其他属性，利用 vue的$$data的方式，这样vue会把数据处理不暴露给用户，仅仅是内部访问。

然后设置 获取state 的值，并禁止直接修改state
```
class Store {
  constructor(options) {
    // 响应式处理的数据
    // 第一种 Vue.util.definReactive
    // this.state = {}
    // for(let i in options.state ){
    //   const item = options.state[i]
    //   Vue.util.defineReactive(this.state, i, item)
    // }    

    // 第二中 newVue
    // $$state不会被vue代理，不会暴露给用户
    this._vm = new Vue({
      data: {
        $$state: options.state
      }
    })
  }

  // 获取state
  get state(){
    console.log('this', this);
    return this._vm._data.$$state //_data等价于$data
  }
  // 禁止用户直接更新state
  set state(v){
    console.error('请使用 commit 或 dispatch 修改state')
  }
}
```

![image.png](https://upload-images.jianshu.io/upload_images/4642829-b709d44750550a1e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

可以看到获取到 state的值了

现在实行commit 的实现

我们先保存mutations和actions 对应的方法，并且由于dispatch里面会异步执行方法，防止this的上下文变化，我们使用bind绑定上下文。
```
class Store {
  constructor(options) {
  constructor(options) {
    // 保存获取的 options
    this._mutations = options.mutations
    this._actions = options.actions

    // 反正调用commit和dispatch的时候，上下文发生变化
    // dispatch的是异步操作，如果不绑定，里面方法调用可能就变为 window或其他对象了
    this.commit= this.commit.bind(this)
    this.dispatch= this.dispatch.bind(this)
....
```
实现commit
```
class Store {
  constructor(options) {
....
  // 实现commit 
  commit(type, payload){
    // 根据type 获取mutation
    const mutation = this._mutations[type] // 是一个函数

    if(!mutation){
      return console.error('mutation 不存在');
    }
    // 执行mutation 并传入 this.state, 和用户 传入的参数
    mutation(this.state, payload)
  }
}

```

实现dispatch
```
  // 实现dispatch
  dispatch(type, payload){
    // 根据 type 获取actions
    const action = this._actions[type]

    if(!action){
      return console.error('action 不存在')
    }

    // action执行的时候可能会传入多个选项 比如 add({commit, state, dispatch, rooState}, payload)  (为了处理复杂的逻辑)
    // 所有第一个参数 直接传入this
    action(this, payload)
  }
```


完整代码
my-vuex.js

```
// 实现一个插件 install
// 实现存储状态

let Vue
class Store {
  constructor(options) {
    // 保存获取的 options
    this._mutations = options.mutations
    this._actions = options.actions

    // 反正调用commit和dispatch的时候，上下文发生变化
    // dispatch的是异步操作，如果不绑定，里面方法调用可能就变为 window或其他对象了
    this.commit= this.commit.bind(this)
    this.dispatch= this.dispatch.bind(this)
    // 响应式处理的数据
    // 第一种 Vue.util.definReactive
    // this.state = {}
    // for(let i in options.state ){
    //   const item = options.state[i]
    //   Vue.util.defineReactive(this.state, i, item)
    // }    

    // 第二中 newVue
    // $$state不会被vue代理，不会暴露给用户
    this._vm = new Vue({
      data: {
        $$state: options.state
      }
    })
  }

  // 获取state
  get state(){
    console.log('this', this);
    return this._vm._data.$$state //_data等价于$data
  }
  // 禁止用户直接更新state
  set state(v){
    console.error('请使用 commit 或 dispatch 修改state')
  }

  // 实现commit 
  commit(type, payload){
    // 根据type 获取mutation
    const mutation = this._mutations[type] // 是一个函数

    if(!mutation){
      return console.error('mutation 不存在');
    }
    // 执行mutation 并传入 this.state, 和用户 传入的参数
    mutation(this.state, payload)
  }

  // 实现dispatch
  dispatch(type, payload){
    // 根据 type 获取actions
    const action = this._actions[type]

    if(!action){
      return console.error('action 不存在')
    }

    // action执行的时候可能会传入多个选项 比如 add({commit, state, dispatch, rooState}, payload)  (为了处理复杂的逻辑)
    // 所有第一个参数 直接传入this
    action(this, payload)
  }
}
function install(_Vue) {
  Vue = _Vue
  // 注册$store
  Vue.mixin({
    beforeCreate() {
      if (this.$options.store) {
        Vue.prototype.$store = this.$options.store
      }
    }
  })
}

export default { Store, install }

```

store/index.js
```
import Vue from 'vue'
import Vuex from '../my-vuex.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    count: 111
  },
  mutations: {
    increment(state) {
      state.count++
    }
  },
  actions: {
    increment(context) {
      setTimeout(() => {
        context.commit('increment')
      }, 500);
    }
  },
  modules: {
  }
})

```
