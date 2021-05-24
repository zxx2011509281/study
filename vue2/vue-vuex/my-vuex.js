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