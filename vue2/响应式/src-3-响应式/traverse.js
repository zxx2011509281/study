const seenObjects = new Set()

export function traverse (val) {
  _traverse(val, seenObjects)
  seenObjects.clear()
}

function _traverse (val, seen) {
  let i, keys
  const isA = Array.isArray(val)
  // 如果不是 数组和对象 ，或者已经被冻结，那么直接返回
  if ((!isA && !isObject(val)) || Object.isFrozen(val)) {
    return
  }
  // 如果当前值有__ob__ 说明当前值是 被observer 转换过的响应式数据
  if (val.__ob__) {
    // 获取dep.id  保证不会重复收集依赖
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }

  if (isA) {
    // 如果是 数组 循环数组中的 每一项 递归调用_traverse
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else {
    // 重点
    // 如果 是 对象，循环对象中 所有的key,然后执行 读取操作val[kyes[i]], 再递归调用_traverse
    // 读取操作会触发getter，即 触发收集依赖的操作。 此时 Dep.target还没有被清空
    // 这时会 把当前的 Watcher实例 收集进去。
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }
}