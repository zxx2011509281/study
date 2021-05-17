// 虚拟节点 创建 真实节点
export default function createElement (vnode) {
  // 创建
  let domNode = document.createElement(vnode.sel)

  // 判断 内部是  子节点 还是 文本

  if (vnode.text != '' && (vnode.children == undefined || vnode.children.length === 0)) {
    // 是文本
    domNode.innerText = vnode.text    

  } else if (Array.isArray(vnode.children) && vnode.children.length > 0) {
    // 内部是子节点， 要递归创建子节点
    for (let i = 0; i < vnode.children.length; i++) {
      // 获取每个虚拟节点
      const ch = vnode.children[i]
      // 创建 真实节点 一旦调用 createElement 函数意味着： 创建了DOM，并且它的elm属性 指向创建的DOM
      const chDom = createElement(ch)

      domNode.appendChild(chDom)
    }
  }
  
  // 补充elm 属性 （必须给elm赋值， 这样传出去之后，只有的patch 函数需要）
  vnode.elm = domNode

  // 返回 纯Dom 对象
  return vnode.elm
}