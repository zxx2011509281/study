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

