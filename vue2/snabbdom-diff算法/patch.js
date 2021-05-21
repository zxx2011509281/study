
import vnode from './vnode'
import createElement from './createElement'
import patchVnode from './patchVnode'

// 对比 新老虚拟节点 diff 算法 (更新老虚拟节点)
// patch 之后 oldVnode.elm 对应的真实DOM会更新，并且 oldVnode.sel 和oldVnode.key会变成 newVnode的sel好可以 以便下次patch
export default function patch (oldVnode, newVnode) {
  // 判断第一个参数 是DOM 节点还是虚拟节点
  if (oldVnode.sel == '' || oldVnode.sel == undefined) {
    // 第一个参数是 DOM 节点， 包装成虚拟节点
    oldVnode = vnode(oldVnode.tagName.toLowerCase(), {}, [], undefined, oldVnode)

  }
  // 判断oldVnode 和 newVnode 是否 相同
  if (oldVnode.key === newVnode.key && oldVnode.sel === newVnode.sel) {
    console.log('同一节点');
    patchVnode(oldVnode, newVnode)
  } else {
    console.log('不是同一节点， 删除旧的，插入新的');
    // 创建 新节点
    const newVnodeElm = createElement(newVnode)

    // 把新虚拟节点的 sel 和 key 赋值给 老虚拟节点 返回下次还是改变后的老虚拟节点与现在的新虚拟节点比较
    oldVnode.sel = newVnode.sel
    oldVnode.key = newVnode.key

    // 插入到老节点 之前
    oldVnode.elm.parentNode.insertBefore(newVnodeElm, oldVnode.elm)
    // 删除老节点
    oldVnode.elm.parentNode.removeChild(oldVnode.elm)
  }
}