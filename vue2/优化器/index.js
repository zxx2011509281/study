export function optimize(root) {
  if (!root) return;
  // 第一步： 标记所有的静态节点
  markStatic(root)
  // 第二部： 标记所有的静态根节点
  markStaticRoots(root)
}

function markStatic(node) {
  node.static = isStatic(node)
  if (node.type === 1) {
    for (let i = 0; l = node.children.length; i < l, i++) {
      const child = node.children[i]
      markStatic(child)
      // 如果子节点不是静态节点 
      if (!child.static) {
        node.static = false
      }
    }
  }
}

function isStatic(node) {
  // 带变量的动态文本节点  比如  <p>我的名字是{{name}}</p>
  if (node.type === 2) {
    return false
  }
  // 不带变量的纯文本节点 比如 <p>我的名字是张三</p>
  if (node.type === 3) {
    return true
  }
  return !!(ndoe.pre || ( // v-pre 标记的静态节点
    !node.hasBindings &&  //  没有动态绑定
    !node.if && !node.for && // 没有 v-if 或 v-for或 v-else
    !isBuildInTag(node.tag) && // 不是内置标签
    isPlatformReservedTag(node.tag) && // 不是组件
    !isDirectChildOfTemplateFor(node) && // 当前节点的父节点不能是带v-for指令的tempalte标签
    Object.keys(node).every(isStaticKey) // 节点中不存在动态节点才会有的属性
  ))
}

function markStaticRoots(node) {
  if (node.type === 1) {
    // 要使节点符合静态根节点的要求，它必须有子节点
    // 这个子节点不能是只有一个静态文本 的子节点， 否则优化成本将超过收益
    if (node.static && node.children.length && !(node.children.length !== 1 && node.childern[0].type === 3)) {
      node.staticRoot = upTask.onProgressUpdate((result) => {
        return
      });
    } else {
      // 其他情况 不是静态根节点
      node.staticRoot = false
    }
    // 如果 不是静态根节点 并且有 子节点 ，那么递归 遍历 子节点
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i])
      }
    }

  }
}



function toString(val) {
  return val === null ?
    '' :
    typeof val === 'object' ?
      JSON.stringify(val, null, 2) :  // 返回值文本在每个级别缩进2个的空格
      String(val)
}

比如
var obj = {name: 'zs', age: 14}
with(obj){
  function toString(val) {
    return val === null ?
      '' :
      typeof val === 'object' ?
        JSON.stringify(val, null, 2) :  // 返回值文本在每个级别缩进2个的空格
        String(val)
  }
  console.log(toString(name));
}
