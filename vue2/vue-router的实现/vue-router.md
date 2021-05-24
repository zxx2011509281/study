#### 用法
* 1. 使用vue-router插件 router.js
```
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)
```
* 2. 创建Router实例 router.js
```
export default new Router({...})
```

* 3. 在跟组件上添加实例， main.js

```
import router from './router.js'
new Vue({
  router,
}).$mount('#app')

```

* 4. 添加路由视图 APP.vue

`<router-view></router-view>`

#### 实现原理

Vue.use(xxx)

那么 xxx要有install方法

创建我们自己的my-vue-router.js
```
let Vue 

// 实现插件
class VueRouter {
  constructor(){
    Vue
  }
}

// 插件要有一个install 方法 
// 接受一个构造函数 _Vue
VueRouter.install = function(_Vue){
  Vue = _Vue // 保存 _Vue
}

export default VueRouter
```
页面会有报错

![image.png](https://upload-images.jianshu.io/upload_images/4642829-6c81d9fb8a36ee89.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

说明需要有 两个组件 需要 注册 封闭是router-link 和 router-view
那么我们全家注册一下
```
let Vue 

// 实现插件
class VueRouter {
  constructor(){
    Vue
  }
}

// 插件要有一个install 方法 
// 接受一个构造函数 _Vue
VueRouter.install = function(_Vue){
  Vue = _Vue // 保存 _Vue

  // 注册router-view  router-link 组件
  Vue.component('router-view',{})
  Vue.component('router-link',{})
}

export default VueRouter
```
但是又产生了新的错误
![image.png](https://upload-images.jianshu.io/upload_images/4642829-8d2804063278887b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
组件 需要template或者render函数

由于我们写template 的时候，是处于runtime-only 阶段，是没有编译器的，对于template模板无法解析
```
  Vue.component('router-view',{
    template: '<div>router-view</div>'
  })
```
![image.png](https://upload-images.jianshu.io/upload_images/4642829-16a8f6c7df62833e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

所有我们只能用render解决
```
let Vue 

// 实现插件
class VueRouter {
  constructor(){
    Vue
  }
}

// 插件要有一个install 方法 
// 接受一个构造函数 _Vue
VueRouter.install = function(_Vue){
  Vue = _Vue // 保存 _Vue

  // 注册router-view  router-link 组件
  Vue.component('router-view',{
    render(h){
      return h('div', 'router-view')
    }
  })
  Vue.component('router-link',{
    render(h){
      return h('div', 'router-link')
    }
  })
}

export default VueRouter
```
控制台终于不报错了。

接下来处理 router-link
`<router-link to="/foo">Go to Foo</router-link>`
我们使用 的是上面的形式， 在render中 第一个参数就 ‘router-link（a标签）’, 第二个参数里面就是跳转的地址， 第三个参数就是插槽的内容

```
 Vue.component('router-link', {
    // 必须传入一个 to 属性 
    props: {
      to: {
        type: String,
        required: true
      }
    },
    render(h) {
      // <router-link to="/foo">Go to Foo</router-link>
      // <a href="#/foo">Go to Foo</a>
      return h('a', { attrs: { 'href': '#' + this.to } }, this.$slots.default)
    }
  })
```
现在router-link其实已经变为了a标签，点击 浏览器的url也会相应变化了。
现在我们要处理 把router-link 当前对应组件的内容 拿出来  并放到 router-view中

意思就是我们从url 中找到对应的组件  ，router.js中就有这个映射关系
```
const routes = [
  { path: '/foo', component: foo },
  { path: '/bar', component: bar }
]
```
还有一个就是我们 组件 用h函数也能直接渲染
比如 我们在my-vue.router.js中直接 引入foo组件 并在 router-view中直接渲染
```
import foo from './components/foo.vue'
// 插件要有一个install 方法 
// 接受一个构造函数 _Vue
VueRouter.install = function (_Vue) {
  Vue = _Vue // 保存 _Vue

  // 注册router-view  router-link 组件
  Vue.component('router-view', {
    render(h) {
      // 从url 中 找到对应的 component  
      return h(foo)
      // return h('div', 'router-view')
    }
  })

```
![image.png](https://upload-images.jianshu.io/upload_images/4642829-418a41ed905362d2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
页面直接就渲染出了foo 组件的内容

好，现在我们去拿到url和 routes 里面 的映射表

其中url 通过window.location.hash 就可以拿到

但是 routes 在my-vue-router中就麻烦一下。
router.js
```
import Vue from 'vue'
import VueRouter from './my-vue-router'
import foo from './components/foo.vue'
import bar from './components/bar.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/foo', component: foo },
  { path: '/bar', component: bar }
]


export default new VueRouter({
  routes
})
```
我们在VueRouter 实例化的时候 把参数routes存起来
my-vue-router.js
```
// 实现插件
class VueRouter {
  constructor(options) {
    this.options = options  // new VueRouter 传入的配置
  }
}

```

在router.js中我们是先 use 调用 install方法 ，然后再new  VueRouter传入的routes。所有我们要获取routes， 
需要再install方法中全局混入beforeCreate的生命周期(只有再new Vue的时候才执行),  这样我们就可以在执行的时候获取到配置的router并给Vue.prototype.$router绑定上， 让所有的组件都可以访问到。

```
VueRouter.install = function (_Vue) {
  Vue = _Vue // 保存 _Vue

  // 全局混入 beforeCreare生命周期
  Vue.mixin({
    // 延迟执行 ，只有再new Vue的时候才执行 这个时候就可以拿到 router了
    beforeCreate(){
      // 只有 在根组件中存在 ，所有只执行一次
      // 获取 main.js  new Vue({ render: h => h(App), router }).$mount('#app')  中的router
      if(this.$options.router){
        // 让所有的组件实例 可以用到router
        console.log('this.$options', this.$options);
        Vue.prototype.$router = this.$options.router
      }
    }
  })
```


现在我们监控url的变化
my-vue-route.js
```
class VueRouter {
  constructor(options) {
    this.options = options // new VueRouter 传入的配置
    this.current = window.location.hash.slice(1) || '/' // url 上hash 的变化
    // 监课url变化 
    window.addEventListener('hashchange', ()=>{
      this.current = window.location.hash.slice(1) // 去掉#
    })
  }
}

```
我们此时看一下 根组件的 this.$options
![image.png](https://upload-images.jianshu.io/upload_images/4642829-e0a97cd0b006bbfd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这个时候我通过 组件 上的router就能访问到当前 path 和 routes配置项了

然后我们到 router-view组件处理
```
  Vue.component('router-view', {
    render(h) {
      // 从url 中 找到对应的 component
      let component = null
      // 获取 current 和 options
      const { current, options } = this.$router;
      // 拿出 options 中 routes 配置项 和current 进行对比
      // 获取对应的 组件
      const route = options.routes.find(route => route.path === current)
      if (route) {
        component = route.component
      }

      return h(component)
    }
  })
```

这个时候的页面我们再点击 route-link的时候 url会变化 ，但是router-view却不会刷新，我们刷新一下页面。router-view才能变化。

原因是 current 不是响应式的，把current 变为响应式后，使用它的组件都会重新render. 这样就会重新渲染了

 Vue.util.defineReactive(this, 'current', window.location.hash.slice(1) || '/')
```
class VueRouter {
  constructor(options) {
    this.options = options // new VueRouter 传入的配置
    // this.current = window.location.hash.slice(1) || '/' // url 上hash 的变化
    Vue.util.defineReactive(this, 'current', window.location.hash.slice(1) || '/')
    // 监课url变化 
    window.addEventListener('hashchange', () => {
      this.current = window.location.hash.slice(1) // 去掉#
    })
  }
}
```


完整的my-vue.router.js
```
let Vue

// 实现插件
class VueRouter {
  constructor(options) {
    this.options = options // new VueRouter 传入的配置
    // this.current = window.location.hash.slice(1) || '/' // url 上hash 的变化
    Vue.util.defineReactive(this, 'current', window.location.hash.slice(1) || '/')
    // 监课url变化 
    window.addEventListener('hashchange', () => {
      this.current = window.location.hash.slice(1) // 去掉#
    })
  }
}
// 插件要有一个install 方法 
// 接受一个构造函数 _Vue
VueRouter.install = function (_Vue) {
  Vue = _Vue // 保存 _Vue

  // 全局混入 beforeCreare生命周期
  Vue.mixin({
    // 延迟执行 ，只有再new Vue的时候才执行 这个时候就可以拿到 router了
    beforeCreate() {
      // 只有 在根组件中存在 ，所有只执行一次
      // 获取 main.js  new Vue({ render: h => h(App), router }).$mount('#app')  中的router
      if (this.$options.router) {
        // 让所有的组件实例 可以用到router
        console.log('this.$options', this.$options);
        Vue.prototype.$router = this.$options.router
      }
    }
  })

  // 注册router-view  router-link 组件
  Vue.component('router-view', {
    render(h) {
      // 从url 中 找到对应的 component
      let component = null
      // 获取 current 和 options
      const { current, options } = this.$router;
      // 拿出 options 中 routes 配置项 和current 进行对比
      // 获取对应的 组件
      const route = options.routes.find(route => route.path === current)
      if (route) {
        component = route.component
      }

      return h(component)
    }
  })
  Vue.component('router-link', {
    // 必须传入一个 to 属性 
    props: {
      to: {
        type: String,
        required: true
      }
    },
    render(h) {
      // <router-link to="/foo">Go to Foo</router-link>
      // <a href="#/foo">Go to Foo</a>
      return h('a', { attrs: { 'href': '#' + this.to } }, this.$slots.default)
    }
  })
}

export default VueRouter


```

