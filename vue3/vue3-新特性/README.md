### 快速开始
* 通过 CDN：<script src="https://unpkg.com/vue@next"></script>
*    通过 [Codepen](https://codepen.io/yyx990803/pen/OJNoaZL) 的浏览器 playground
* 脚手架 [Vite](https://github.com/vitejs/vite)
```
npm init vite-app hello-vue3 # OR yarn create vite-app hello-vue3
```
* 脚手架 [vue-cli](https://cli.vuejs.org/)
```
npm install -g @vue/cli # OR yarn global add @vue/cli
vue create hello-vue3
# select vue 3 preset
```

#### vite
>Vite，一个基于浏览器原生 ES imports 的开发服务器。利用浏览器去解析 imports，在服务器端按需编译返回，完全跳过了打包这个概念，服务器随起随用。同时不仅有 Vue 文件支持，还搞定了热更新，而且热更新的速度不会随着模块增多而变慢。针对生产环境则可以把同一份代码用 rollup 打包。虽然现在还比较粗糙，但这个方向我觉得是有潜力的，做得好可以彻底解决改一行代码等半天热更新的问题。
https://juejin.cn/post/6928175048163491848


#### new Vue()与createApp() 创建实例
* vue2
```
    import Vue from 'vue'
    import App from './App.vue'
    new Vue({
        render: h => h(App),
    }).$mount('#app')
```
* vue3 
```
    import { createApp } from 'vue';
    import App from './App.vue'

    createApp(App).mount('#app')

```
**一个新的全局 API：createApp**
调用 createApp 返回一个应用实例，这是 Vue 3 中的新概念
应用实例暴露当前全局 API 的子集，经验法则是，任何全局改变 Vue 行为的 API 现在都会移动到应用实例上，以下是当前全局 API 及其相应实例 API 的表
| 2.x 全局 API | 3.x 实例 API (`app`) |
| --- | --- |
| Vue.config | app.config |
| Vue.config.productionTip | *removed*  |
| Vue.config.ignoredElements | app.config.isCustomElement  |
| Vue.component | app.component |
| Vue.directive | app.directive |
| Vue.mixin | app.mixin |
| Vue.use | app.use |


#### Fragment
vue3不会再像vue2一样需要手动添加一个根结点
vue2中 如果你创建一个Vue组件，那么它只能有一个根节点。 这意味着不能创建这样的组件：
```
<template>
  <div>Hello</div>
  <div>World</div>
</template>
```
原因是代表任何Vue组件的Vue实例需要绑定到一个单一的DOM元素中。唯一可以创建一个具有多个DOM节点的组件的方法就是创建一个没有底层Vue实例的功能组件。 结果发现React社区也遇到了同样的问题。他们想出的解决方案是一个名为 Fragment 的虚拟元素。它看起来差不多是这样的：
```
class Columns extends React.Component {
  render() {
    return (
      <React.Fragment>
        <td>Hello</td>
        <td>World</td>
      </React.Fragment>
    );
  }
}
```
尽管Fragment看起来像一个普通的DOM元素，但它是虚拟的，根本不会在DOM树中呈现。这样我们可以将组件功能绑定到一个单一的元素中，而不需要创建一个多余的DOM节点。 目前你可以在Vue 2中使用vue-fragments库来使用Fragments，而在Vue 3中，你将会在开箱即用!

#### Teleport
Vue 鼓励我们通过将 UI 和相关行为封装到组件中来构建 UI。我们可以将它们嵌套在另一个内部，以构建一个组成应用程序 UI 的树。

然而，有时组件模板的一部分逻辑上属于该组件，而从技术角度来看，最好将模板的这一部分移动到 DOM 中 Vue app 之外的其他位置。

一个常见的场景是创建一个包含全屏模式的组件。在大多数情况下，你希望模态的逻辑存在于组件中，但是模态的定位很快就很难通过 CSS 来解决，或者需要更改组件组合。
比如下面：
html
```
<body>
  <div style="position: relative;">
    <h3>Tooltips with Vue 3 Teleport</h3>
    <div>
      <modal-button></modal-button>
    </div>
  </div>
</body>
```
modal-button
```
app.component('modal-button', {
  template: `
    <button @click="modalOpen = true">
        Open full screen modal! (With teleport!)
    </button>

    <teleport to="body">
      <div v-if="modalOpen" class="modal">
        <div>
          I'm a teleported modal! 
          (My parent is "body")
          <button @click="modalOpen = false">
            Close
          </button>
        </div>
      </div>
    </teleport>
  `,
  data() {
    return { 
      modalOpen: false
    }
  }
})

```
**Teleport 提供了一种干净的方法，允许我们控制在 DOM 中哪个父节点下呈现 HTML，而不必求助于全局状态或将其拆分为两个组件。**
因此，一旦我们单击按钮打开模式，Vue 将正确地将模态内容渲染为 body 标签的子级。(解决了fixed弹窗中 有用出现 全屏的弹窗这种问题)

#### v-model 双向绑定
绑定响应式的props属性写法
```
父
<text-document
  v-bind:title="title"
  v-on:update:title="title = $event"
></text-document>

子
this.$emit('update:title', newTitle)

```
vue2 使用.sync修饰符来简化父组件的绑定
`<text-document v-bind:title.sync="doc.title"></text-document>`
vue3中则将.sync封装到了v-model之中
`<text-document v-model:title="doc.title" />`

**多个 v-model 绑定**

```
<user-name
  v-model:first-name="firstName"
  v-model:last-name="lastName"
></user-name>


const app = Vue.createApp({})

app.component('user-name', {
  props: {
    firstName: String,
    lastName: String
  },
  template: `
    <input 
      type="text"
      :value="firstName"
      @input="$emit('update:firstName', $event.target.value)">

    <input
      type="text"
      :value="lastName"
      @input="$emit('update:lastName', $event.target.value)">
  `
})
```

#### 响应式
vue2 
`Object.defineProperty(obj, prop, descriptor)`
vue3
`new Proxy(target, handler);`

#### 组合式API 与 选项式
Vue3 是向下兼容 Vue2 API 的，但是 Vue3 中提供了一种全新的 Composition API

一个大型组件，有很多关注点，比如一个功能要实现a, 会在data、computed、methods、watch加入代码。 后面增加功能b, 又会在data、computed、methods、watch中加入代码。这样一直加下去。 就很有很多逻辑关注点；

为了修改功能a，我们可能要从data ,跳转到methods,然后又跳转到其他methods,computed等，这样增加了理解和维护难度。

如果我们能够将与同一个逻辑关注点相关的代码配置在一起会更好。而这正是组合式 API 使我们能够做到的。



#### 组合式 API 基础

既然我们知道了**为什么**，我们就可以知道**怎么做**。为了开始使用组合式 API，我们首先需要一个可以实际使用它的地方。在 Vue 组件中，我们将此位置称为 `setup`。

我们可以在外面建了多个逻辑 a.js  b.js  c.js 里面实现不同的逻辑（data，methods, watch, computed，mounted, updated, provide, inject等都在各自的js总完成）， 然后再setup 中引入对应js执行就行。 
```
  name: 'App',
  components: {
    HelloWorld
  },
  setup(props, context){
    console.log('props', props);
    console.log('context', context);
  }
}
```
执行时机
```
  setup(props, context) {
    console.log('setup');
  },
  beforeCreate(){
    console.log('beforeCreate');
  },
  created(){
    console.log('created');
  }
```
![image.png](https://upload-images.jianshu.io/upload_images/4642829-fbaeee067cded4ac.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
可以看出 是在beforeCreate之前执行。执行 setup 时，组件实例尚未被创建，所以不能使用this访问实例。（methods这些也就不能使用了）

#### setup 参数
1. props
2. context

**Props**
setup 函数中的第一个参数是 props。正如在一个标准组件中所期望的那样，setup 函数中的 props 是响应式的，当传入新的 prop 时，它将被更新。
>但是，因为 props 是响应式的，你不能使用 ES6 解构，因为它会消除 prop 的响应性。

**上下文**
传递给 setup 函数的第二个参数是 context。context 是一个普通的 JavaScript 对象，它暴露三个组件的 property：

```

export default {
  setup(props, context) {
    // Attribute (非响应式对象) 没用props传递的属性 
    console.log(context.attrs)

    // 插槽 (非响应式对象)
    console.log(context.slots)

    // 触发事件 (方法)
    console.log(context.emit)
    // 暴露
    console.log(context.expose)
  }
}
```

#### setup  生命周期钩子

|选项式 API|	Hook inside setup|
|----|----|
|beforeCreate	|Not needed*|
|created|	Not needed*|
|beforeMount	|onBeforeMount
|mounted|	onMounted
|beforeUpdate	|onBeforeUpdate
|updated	|onUpdated
|beforeUnmount|	onBeforeUnmount
|unmounted	|onUnmounted
|errorCaptured	|onErrorCaptured
|renderTracked|	onRenderTracked
|renderTriggered|	onRenderTriggered

这些函数接受一个回调函数，当钩子被组件调用时将会被执行:
```
// MyBook.vue

export default {
  setup() {
    // mounted
    onMounted(() => {
      console.log('Component is mounted!')
    })
  }
}
```

#### 响应性基础

**声明响应式状态**
要为 JavaScript 对象创建响应式状态，可以使用 reactive 方法：
```
import { reactive } from 'vue'

// 响应式状态
const state = reactive({
  count: 0
})
return{state}
```
**创建独立的响应式值作为 refs**
```
import { ref } from 'vue'

const count = ref(0)
console.log(count.value) // 0

count.value++
console.log(count.value) // 1
return  { count }
```
template中 不用 使用value
```<div>{{count}}</div>```

**访问响应式对象**
```
const count = ref(0)
const state = reactive({
  count
})

console.log(state.count) // 0

state.count = 1
console.log(count.value) // 1

return {state, count }

```

**toRef**
可以用来为源响应式对象上的 property 性创建一个 [`ref`](https://vue3js.cn/docs/zh/api/refs-api.html#ref)。然后可以将 ref 传递出去，从而保持对其源 property 的响应式连接
```
const state = reactive({
  foo: 1,
  bar: 2
})

const fooRef = toRef(state, 'foo')

fooRef.value++
console.log(state.foo) // 2

state.foo++
console.log(fooRef.value) // 3
```
**响应式状态解构 toRefs**
将响应式对象转换为普通对象，其中结果对象的每个 property 都是指向原始对象相应 property 的[`ref`](https://vue3js.cn/docs/zh/api/refs-api.html#ref)。

```
const state = reactive({
  foo: 1,
  bar: 2
})

const stateAsRefs = toRefs(state)

// ref 和 原始property “链接”
state.foo++
console.log(stateAsRefs.foo.value) // 2

stateAsRefs.foo.value++
console.log(state.foo) // 3

```

**computed**
使用 getter 函数，并为从 getter 返回的值返回一个不变的响应式 [ref](https://vue3js.cn/docs/zh/api/refs-api.html#ref) 对象。

```
const count = ref(1)
const plusOne = computed(() => count.value + 1)

console.log(plusOne.value) // 2

plusOne.value++ // error

```

**watchEffect**
为了根据响应式状态自动应用和重新应用副作用，我们可以使用 watchEffect 方法。它`立即执行`传入的一个函数，同时响应式追踪其依赖，并在`其依赖变更时重新运行该函数`。
```
const count = ref(0)

watchEffect(() => console.log(count.value))
// -> logs 0

setTimeout(() => {
  count.value++
  // -> logs 1
}, 100)
```

**watchEffect停止监听**
当 `watchEffect` 在组件的 [setup()](https://vue3js.cn/docs/zh/guide/composition-api-setup.html) 函数或[生命周期钩子](https://vue3js.cn/docs/zh/guide/composition-api-lifecycle-hooks.html)被调用时，侦听器会被链接到该组件的生命周期，并在组件卸载时自动停止。
```
const stop = watchEffect(() => {
  /* ... */
})

// later
stop()
```

**watchEffect 清除副作用**
有时副作用函数会执行一些异步的副作用，这些响应需要在其失效时清除 (即完成之前状态已改变了) 。所以侦听副作用传入的函数可以接收一个 onInvalidate 函数作入参，用来注册清理失效时的回调。当以下情况发生时，这个失效回调会被触发：

* 副作用即将重新执行时
* 侦听器被停止 (如果在 setup() 或生命周期钩子函数中使用了 watchEffect，则在组件卸载时)


比如： 假设我们现在用一个用户ID去查询用户的详情信息，然后我们监听了这个用户ID， 当用户ID 改变的时候我们就会去发起一次请求，但是如果在请求数据的过程中，我们的用户ID发生了多次变化，那么我们就会发起多次请求，而最后一次返回的数据将会覆盖掉我们之前返回的所有用户详情。这不仅会导致资源浪费， watchEffect 我们就可以做到
```
<template>
  <div> count:{{count}}</div>
  <div @click="fn">click</div>
</template>

<script>
import { watchEffect, ref } from 'vue'
export default {
  setup() {
    const count = ref(2)
    watchEffect((onInvalidate) => {
      console.log(count.value, '副作用1111')

      const token = setTimeout(() => {
        console.log(count.value, '副作用22222')
        // 发送请求
      }, 4000)

      onInvalidate(() => {
        // 4 秒之内改变  清除副作用
        // token 是 上一下 watchEffect 中 返回的token
        clearTimeout(token)
      })
    })
    function fn() {
      count.value++
    }
    return {
      fn,
      count,
    }
  },
}
</script>
用户 点击4秒内 再次点击 会取消上一次的 请求 ，如果4秒内 没有点击，再发送请求

```

**副作用刷新时机**
Vue 的响应性系统会缓存副作用函数，并异步地刷新它们，这样可以避免同一个“tick” 中多个状态改变导致的不必要的重复调用。在核心的具体实现中，组件的 update 函数也是一个被侦听的副作用。当一个用户定义的副作用函数进入队列时，默认情况下，会在所有的组件 update 前执行;

flush: post; 在组件 update之后执行
// 在组件更新后触发，这样你就可以访问更新的 DOM。
// 注意：这也将推迟副作用的初始运行，直到组件的首次渲染完成。

```
    const count = ref(0)

    watchEffect(
      () => {
        console.log('watchEffect', count.value)
      },
      {
        // flush: 'pre',
        // flush: 'post',
        // flush: 'async',
      }
    )
    onBeforeUpdate(() => {
      console.log('组件更新')
    })

    setTimeout(() => {
      count.value++
    }, 1000)
    return {
      count,
    }
  },

```
默认 pre ; watchEffect 比 组件更新 先打印
post: watchEffect 比 组件更新  后打印
sync 强制效果始终同步触发， 然而这时低效的，很少需要

**watch**
`watch` API 完全等同于组件[侦听器](https://vue3js.cn/docs/zh/guide/computed.html#%E4%BE%A6%E5%90%AC%E5%99%A8) property。`watch` 需要侦听特定的数据源，并在回调函数中执行副作用。`默认情况下，它也是惰性的，即只有当被侦听的源发生变化时才执行回调`。

与 [watchEffect](https://vue3js.cn/docs/zh/guide/reactivity-computed-watchers.html#watcheffect) 比较，`watch` 允许我们：

*   懒执行副作用；
*   更具体地说明什么状态应该触发侦听器重新运行；
*   访问侦听状态变化前后的值
```
    // 直接侦听ref
    const count = ref(0)
    watch(count, (count, prevCount) => {
      console.log('watch1', count, prevCount)
    })

    setTimeout(() => {
      count.value = 22
    }, 2000)

    // 直接监听 getter
    const state = reactive({ count: 0 })
    watch(
      () => state.count,
      (count, prevCount) => {
        console.log('watch2', count, prevCount)
      }
    )
     setTimeout(() => {
      state.count = 33
    }, 2000)

    // 监听多个数据源
    const firstName = ref('')
    const lastName = ref('')

    watch([firstName, lastName], (newValues, prevValues) => {
      console.log(newValues, prevValues)
    })

    firstName.value = 'John' // logs: ["John",""] ["", ""]
    lastName.value = 'Smith' // logs: ["John", "Smith"] ["John", ""]

    // 监听响应式对象
    const numbers = reactive([1, 2, 3, 4])

    watch(
      () => [...numbers],
      (numbers, prevNumbers) => {
        console.log(numbers, prevNumbers)
      }
    )

    numbers.push(5) // logs: [1,2,3,4,5] [1,2,3,4]


    // immediate deep 
    const state = reactive({ count: 0, obj: {name: 'zs'} })
    watch(
      () => state,
      (count, prevCount) => {
        console.log('watch2', state.obj.name)
      },
      {
        immediate: true, // 初始 立即执行
        deep: true //深 监听  没有 deep 不会答应 watch2
      }
    )
    setTimeout(() => {
      state.obj.name = 'ls'
    }, 2000)

```
**watchEffect与watch 区别**
* watchEffect 不需要指定监听的属性，他会`自动收集依赖`， 只要我们`回调中引用到了响应式的属性`， 就达到了监听效果，而 watch 只能监听`指定的属性`而做出变更(v3开始可以同时指定多个)。
* watch可以获取到`新值与旧值`（更新前的值），而 watchEffect 是拿不到的。
* watchEffect如果存在的话，在`组件初始化的时候就会执行一次`用以收集依赖（与computed同理），而后收集到的依赖发生变化，这个回调才会再次执行，而 watch 不需要，因为他一`开始就指定了依赖`。
* watchEffect会`返回一个用于停止这个监听的函数`

**提供/注入**
我们也可以在组合式 API 中使用 [provide/inject](https://vue3js.cn/docs/zh/guide/component-provide-inject.html)。两者都只能在当前活动实例的 [`setup()`](https://vue3js.cn/docs/zh/guide/composition-api-setup.html) 期间调用。

父
```
<!-- src/components/MyMap.vue -->
<template>
  <MyMarker />
</template>

<script>
import { provide, reactive, ref } from 'vue'
import MyMarker from './MyMarker.vue

export default {
  components: {
    MyMarker
  },
  setup() {
    const location = ref('North Pole')
    const geolocation = reactive({
      longitude: 90,
      latitude: 135
    })

    const updateLocation = () => {
      location.value = 'South Pole'
    }

    provide('location', location)
    provide('geolocation', geolocation)
    provide('updateLocation', updateLocation) // 注入修改方法
  }
}
</script>

```
子
```
<!-- src/components/MyMarker.vue -->
<script>
import { inject } from 'vue'

export default {
  setup() {
    const userLocation = inject('location', 'The Universe')
    const userGeolocation = inject('geolocation')
    const updateUserLocation = inject('updateLocation')

    return {
      userLocation,
      userGeolocation,
      updateUserLocation
    }
  }
}
</script>

```


**其他响应式API**

`readonly`
接受一个对象 (响应式或纯对象) 或 ref 并返回原始对象的只读代理。只读代理是深层的：任何被访问的嵌套 property 也是只读的。

`isProxy`
检查对象是否是由 reactive 或 readonly 创建的 proxy。

`isReactive`
检查对象是否是由 reactive 创建的响应式代理。
如果该代理是 readonly 创建的，但包裹了由 reactive 创建的另一个代理，它也会返回 true。

`isReadonly`
检查对象是否是由 readonly 创建的只读代理。

`toRaw`
返回 reactive 或 readonly 代理的原始对象。这是一个“逃生舱”，可用于临时读取数据而无需承担代理访问/跟踪的开销，也可用于写入数据而避免触发更改。不建议保留对原始对象的持久引用。请谨慎使用。

`markRaw`
标记一个对象，使其永远不会转换为 proxy。返回对象本身。

`shallowReactive`
创建一个响应式代理，它跟踪其自身 property 的响应性，但不执行嵌套对象的深层响应式转换 (暴露原始值)。

`shallowReadonly`
创建一个 proxy，使其自身的 property 为只读，但不执行嵌套对象的深度只读转换 (暴露原始值)。

`unref`
如果参数是一个 ref，则返回内部值，否则返回参数本身。这是 val = isRef(val) ? val.value : val 的语法糖函数。

`isRef`
检查值是否为一个 ref 对象。

`customRef`
创建一个自定义的 ref，并对其依赖项跟踪和更新触发进行显式控制。它需要一个工厂函数，该函数接收 track 和 trigger 函数作为参数，并且应该返回一个带有 get 和 set 的对象。

```
<template>
  <input v-model="text" />
  {{text}}
</template>

<script>
import {customRef} from 'vue'
export default {
  setup() {
    function useDebouncedRef(value, delay = 500) {
      let timeout
      return customRef((track, trigger) => {
        return {
          get() {
            track()
            return value
          },
          set(newValue) {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
              value = newValue
              trigger()
            }, delay)
          },
        }
      })
    }
    return {
      text: useDebouncedRef('hello'),
    }
  },
}
</script>

```

`shallowRef`
创建一个跟踪自身 .value 变化的 ref，但不会使其值也变成响应式的。

`triggerRef`
手动执行与 shallowRef 关联的任何副作用。
```
<script>
import { shallowRef, ref, watchEffect, triggerRef } from 'vue'
export default {
  setup() {
    // 会打印 两次
    // const shallow = ref({
    //   greet: 'Hello, world',
    // })
    // watchEffect(() => {
    //   console.log(shallow.value.greet)
    // })
    // shallow.value.greet = 'Hello, universe'

    // 在triggerRef后才会打印第二次
    const shallow = shallowRef({
      greet: 'Hello, world',
    })
    watchEffect(() => {
      console.log(shallow.value.greet)
    })
    shallow.value.greet = 'Hello, universe'

    setTimeout(() => {
      triggerRef(shallow)
    }, 1500);      
  },
}
</script>
```

