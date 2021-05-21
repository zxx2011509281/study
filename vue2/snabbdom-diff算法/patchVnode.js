

import vnode from './vnode'
import createElement from './createElement'
import updateChildren from './updateChildren.js'

// patch函数中 同一节点的 算法
// patchVnode 之后 oldVnode.elm 对应的真实DOM会更新。 oldVnode.elm就是真实DOM
export default function patchVnode (oldVnode, newVnode) {
  // 判断新旧vnode 是不是 同一个对象  是直接返回
  if (oldVnode === newVnode) { return }
  // 判断新vnode 是否有text 属性
  if (newVnode.text != undefined && (newVnode.children == undefined || newVnode.children.length == 0)) {
    console.log('newVnode 有text 属性');
    // 把新vnode的text 替换老节点的innerText
    if (newVnode.text !== oldVnode.text) {
      oldVnode.elm.innerText = newVnode.text
    }
  } else {
    // 新 vnode 没有text 属性，有children 属性
    // 判断老虚拟节点 有没有children 属性
    if (oldVnode.children != undefined && oldVnode.children.length > 0) {
      // 老虚拟节点有children  新虚拟节点也有childern 最复杂的判断
      updateChildren(oldVnode.elm, oldVnode.children, newVnode.children)

    } else {
      // 老虚拟节点没有children (清空text，追加children)
      // 情况 老虚拟节点 内容
      oldVnode.elm.innerHTML = ''
      // 追加children
      for (let i = 0; i < newVnode.children.length; i++) {
        let dom = createElement(newVnode.children[i])
        oldVnode.elm.appendChild(dom)
      }
    }
  }
}