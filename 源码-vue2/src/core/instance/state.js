/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'
import { isUpdatingChildComponent } from './lifecycle'

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving
} from '../observer/index'

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute,
  invokeWithErrorHandling
} from '../util/index'

// 默认属性描述符
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

// 代理  
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  // 按顺序初始化状态 props, methods, data, computed, watch
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}

function initProps (vm: Component, propsOptions: Object) {
  // vm.$options.propsData 是用户通过父组件传入或用户 new Vue 时 传入的 props
  const propsData = vm.$options.propsData || {}
  // _props 中 会保存 所有设置到 props变量中的属性
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  // 缓存道具键，以便将来更新可以使用数组进行迭代
  // 缓存props对象中 的key 
  const keys = vm.$options._propKeys = []
  // 当前实例 是不是 根实例
  const isRoot = !vm.$parent
  // root instance props should be converted
  if (!isRoot) {
    // 只有root实例的props属性应该被转换为响应式  不能被 observe观察 即不能 new Observe
    toggleObserving(false)
  }
  // 循环propsOptions ，将key添加到keys中。 调用validateProp 函数得到 prop的值，通过
  // defineReactive 添加到 vm._props中 变为响应式
  for (const key in propsOptions) {
    keys.push(key)
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      // toggleObserving(false) 是为了 能通过 props访问 props[key] 对应的value值
      // 但是 不转换为 响应式 （访问和修改 都会 引起 watcher 更新
      // 在 validateProp 中 value 已经是响应式的了。通过父组件修改 值，响应变化
      // 而不能 在当前组件通过 访问 props[key] 修改 value值
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    // 最后判断 key是否再实例 vm中，如果不存在调用 proxy，在 vm上设置一个以key为属性的代理
    // 这样this.[key] 就可以访问 this._props.[key]了
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  // 重置 可响应式 
  toggleObserving(true)
}

// 初始化 data
function initData (vm: Component) {
  let data = vm.$options.data
  // data 是 函数 ，执行并转换为响应式 ， 否则 就是 自己 
  data = vm._data = typeof data === 'function'
    ? getData(data, vm) // getData 把 data 里面 的值 转换为响应式 ，并返回 对象类型
    : data || {}
    // data 如果不是 对象 设置默认值为 空对象
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      // 方法 中已经 存在 该 key 警告 （在生产环境下 是可以 重复命名的）
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    // props 中 已经存在 会警告
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      //  不是以  $ or _ 开头的话， 把 _data上的key 代理 到vm上。 (不能以 $ _开头设置 key)
      // 直接 访问 vm[key] 就可以访问 vm._data[key]
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  // 观察data， 转换为响应式
  observe(data, true /* asRootData */)
}

// 把 data中的值 与 当前 vm实例 关联 转换为响应式
export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget()
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}

// 设置 watcher 时的 lazy 为true , 实例化时 告诉 watcher 生成一个 供计算属性使用的watcher 实例
const computedWatcherOptions = { lazy: true }

function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  // 保存计算属性的watcher 实例
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  // 计算属性 在SSR 环境，只是一个 普通的 getter 方法
  const isSSR = isServerRendering()

  //  遍历 computed 对象
  for (const key in computed) {
    const userDef = computed[key]
    // 获取 getter , 函数直接本身，对象获取对象上的get函数
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    //  服务端环境 没必要
    if (!isSSR) {
      // create internal watcher for the computed property.
      // 比如： fullName : function(){return this.firstname + this.lastname}
      //  由于 computed 的wathcer lazy,所有开始并不会 执行 get.
      //  new Watcher(vm, updateComponent, noop, 。。。) 这个 组件更新的watcher ,会 对模板仅仅访问，获取到当前
      // computed的 值，才出发 sharedPropertyDefinition.get 函数.
      // watcher.evaluate() 会 执行 computed的函数 比如上面的 return this.firstname + this.lastname
      // 这样 fullname这个watcher 就会 保存 firstanme 和 lastname 的 dep 
      // 记录完之后 继续， 这个时候 的Dep.target 时 updateCOmponent对于的 Watcher.
      // computed 的 watcher.depend()。 会把 computed里面的 所有dep （firstname, lastname的dep），分别收集
      // updateCOmponent对于的 Watcher。 这样 ，当 firstname或者 lastname变化时， 它们的dep 执行 dep.notify
      // 通知 每个 watcher 执行 update 方法 。  而 computed第 三个参数 是noop。所有没有回调执行。
      // 而 updateCOmponent 的watcher update 会让页面 重新 render
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      } else if (vm.$options.methods && key in vm.$options.methods) {
        warn(`The computed property "${key}" is already defined as a method.`, vm)
      }
    }
  }
}

// 属性的 getter 和 setter 根据 userDef 设置
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  // 非服务端环境下 计算属性才缓存
  const shouldCache = !isServerRendering()
  // userDef 可能是 函数  也可能是 对象 {get: fn, set: fn}
  // 如果是函数 ，将函数作为 getter函数
  // 如果是对象， 将get方法作为getter方法，set方法作为setter方法
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef) // 不需要缓存 ，仅仅执行 函数即可
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

// 缓存 key
function createComputedGetter (key) {
  // 返回的getter 在 initComputed的时候不会执行 （lazy 为 true  constructor时 不会执行 this.get）
  // 等到 lifecycle 中 beforeMount 生命周期 之后  
  // 对 new Watcher(vm, updateComponent, noop, ...)  //  (updateComponent 先调用渲染函数 获取一份最新的Vnode节点树， 然后通过 _update方法 对最新的 Vnode和 旧Vnode进行对比，更新DOM节点。)
  // new Watcher 会 由于, 没有lazy 会执行 this.get() ，此时的Dep.target 为 updateComponent的watcher（组件的watcher），而 updateComponent 会 对 所有节点进行对比 ，所有 会触发 computed 这里的 getter
  // 这里 watcher.dirty（constructor 的时候 this.dirty = this.lazy）, evaluate 此时 执行 this.get 
  // 把 computed 对应的 watcher 保存 到 Dep.target中 , 执行 computed的函数 或 get 获取 返回值，popTarget之后 Dep.target 继续变为 updateComponent的Watcher（组件的watcher）
  // 执行 到 Dep.target 时  其实 就是 updateComponent的Watcher（组件的watcher），watcher.depend 把 computed 的 watcher中 用到 的dep依赖列表循环（所有的computed的 dep 依赖列表）， 都 添加 当前 updateComponent的Watcher （组件的watcher）
  // 这样 当 computed 的 getter 中 有变化，会 触发 updateComponent的Watcher （组件的watcher）的更新，即页面 更新
  return function computedGetter () {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      // dirty 设置 为 true之后 ，下一次读取 计算属性才会 重新计算
      if (watcher.dirty) {
        watcher.evaluate()
      }
      // 把 当前 读取计算属性的watcher 添加到 计算属性所有的依赖列表中
      // 这样 依赖列表 有变化 ，都会 通知 当前 这个watcher 更新（比如更新视图）
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter () {
    return fn.call(this, this)
  }
}

// 初始化方法
function initMethods (vm: Component, methods: Object) {
  const props = vm.$options.props
  // 遍历vm.$options中的methods
  for (const key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      // method不是 函数 警告
      if (typeof methods[key] !== 'function') {
        warn(
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      // 如果 props 中已经 有 这个 key 警告
      if (props && hasOwn(props, key)) {
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      // 如果 vm[key] 实例上已经什么过 警告
      if ((key in vm) && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    // 把method方法 挂载 到 vm实例上 
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}

function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}

export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  Vue.prototype.$set = set
  Vue.prototype.$delete = del

  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) {
      const info = `callback for immediate watcher "${watcher.expression}"`
      pushTarget()
      invokeWithErrorHandling(cb, vm, [watcher.value], vm, info)
      popTarget()
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}
