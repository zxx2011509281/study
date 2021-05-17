###vm.$set实现
语法： vm.$set(target, key, value)
参数：
 * {Object | Array} target
* {String | Number} key
* {any} value

返回值：{Function} unwatch

用法： 在object上设置一个属性，如果object 是响应式的， 那么添加的属性也会变为响应式。 这个方法可以用来避开 Vue.js不能侦测属性被添加的限制；

下面开始实现
首页给Vue挂载set方法
```
import {set} from './Observer'
Vue.prototype.$set = set
```
在Observer.js中添加 set方法
先处理数组方法
```
// 添加 set方法
export function set(target, key, val){

  // 如果 是数组，并且key 是有效的索引值
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 获取数组的最长的长度 ，有可能是 修改 list某一项，有可能是新增某一项
    target.length = Math.max(target.length, key)
    // 数组的 splice方法已经被侦测，索引调用splice方法会 自动触发依赖更新
    target.splice(key, 1, val)
    return val
  }
}
```
由于是给响应式数据target 设置新的 值key，并且变为响应式 。所以数组target的 七个方法 已经被处理为响应式了。直接添加或修改就行；

接下里处理对象 中已经存在的值
```
  // key已经存在 target中。那么key本来就是响应式的，这里只需要修改值就行
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
```
处理对象 的新增
```
  // 获取 target的__ob__属性
  const ob = target.__ob__
  // 如果 是 VUe.js实例 或者 是根数据对象 直接返回并 不是生产环境警告
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果没有 __ob__，那么 target不是响应式的，直接修改返回（前提是响应式对象新增值才能变为响应式）
  if (!ob) {
    target[key] = val
    return val
  }
  // 给 target__ob__value 就是自己， 把新增 属性转换为响应式
  defineReactive(ob.value, key, val)
  // 通知 依赖更新
  ob.dep.notify()
  return val
```
上面会先判断 `target不能是Vue的实例或者是Vue实例的根数据对象（this.$data）`， 再来判断 `target 必须是响应式`的前提下，再来给新增属性 调用`defineReactive转换为响应式`，之后`自动 通知依赖更新`；

Observer.js中 关于 set 的完整代码
```
export function set(target, key, val) {

  // 如果 是数组，并且key 是有效的索引值
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 获取数组的最长的长度 ，有可能是 修改 list某一项，有可能是新增某一项
    target.length = Math.max(target.length, key)
    // 数组的 splice方法已经被侦测，索引调用splice方法会 自动触发依赖更新
    target.splice(key, 1, val)
    return val
  }
  // key已经存在 target中。那么key本来就是响应式的，这里只需要修改值就行
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }

  // 获取 target的__ob__属性
  const ob = target.__ob__
  // 如果 是 VUe.js实例 或者 是根数据对象 直接返回并 不是生产环境警告
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果没有 __ob__，那么 target不是响应式的，直接修改返回（前提是响应式对象新增值才能变为响应式）
  if (!ob) {
    target[key] = val
    return val
  }
  // 给 target__ob__value 就是自己， 把新增 属性转换为响应式
  defineReactive(ob.value, key, val)
  // 通知 依赖更新
  ob.dep.notify()
  return val
}
```


###vm.$delete实现
语法： vm.$delete(target, key)
参数：
 * {Object | Array} target
* {String | Number} key

用法： 删除对象的属性。如果对象是响应式的，需要确保删除能触发更新视图（通知依赖更新）。避开vue.js不能检测属性被删除的限制；

代码实现
```
import {del} from './Observer'
Vue.prototype.$delete = del
```

Observer.js中实现 del方法
```
// 添加delete方法
export function del (target, key) {
  // 如果是数组，切key是下有效的
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 直接 删除就行  如果target 是响应式的，那么splice方法会自动触发依赖更新
    target.splice(key, 1)
    return
  }
  // 获取 __ob__
  const ob = target.__ob__
  // 判断 target 不能是Vue实例 且 不能是 Vue实例 的根属性对象
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  // 如果key 不是target自身的属性， 停止程序继续执行
  if (!hasOwn(target, key)) {
    return
  }
  //  删除对象 上的 key值
  delete target[key]
  // 如果不是响应式 对象 直接返回
  if (!ob) {
    return
  }
  // 响应式对象的话 ，通知依赖更新
  ob.dep.notify()
}
```

del方法 其实上就是
delete this.obj.name // 删除对象上的值
this.obj__ob__.notify // 手动触发依赖更新

在代码中 多了一些边际判断而已



