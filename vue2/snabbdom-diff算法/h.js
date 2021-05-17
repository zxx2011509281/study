import vnode from './vnode.js'

/**
 * 低配版的 h函数， 只接受三个参数。 返回虚拟节点 
 * 
 * 1、h('div', {}, '文字')
 * 2、h('div', {}, [])
 * 3、h('div', {}, h())
 * **/
export default function (sel, data, c) {
  // 检查参数个数
  if (arguments.length !== 3) {
    throw new Error('必须三个参数')
  }
  // 检查 c 的类型 第一种类型
  if (typeof c === 'string' || typeof c === 'number') {
    return vnode(sel, data, undefined, c, undefined)
  } else if (Array.isArray(c)) {
    // 第二种类型
    let children = []
    // 遍历c  收集children
    for (let i = 0; i < c.length; i++) {
      if (!(typeof c[i] === 'object' && c[i].hasOwnProperty('sel'))) {
        throw new Error('传入的数组参数中 必须是 h 函数')
      }
      children.push(c[i])
    }
    return vnode(sel, data, children, undefined, undefined)
  } else if (typeof c === 'object' && c.hasOwnProperty('sel')) {
    // 第三种类型
    // 传入 的 c 就是唯一的children
    return vnode(sel, data, [c], undefined, undefined)
  } else {
    throw new Error('传入类型不对')
  }

}