import patchVnode from './patchVnode.js'
import createElement from './createElement'

// 四种命中查找算法
export default function updateChildren (parentElm, oldCh, newCh) {
  
  // 旧前
  let oldStartIdx = 0;
  // 新前
  let newStartIdx = 0;
  // 旧后
  let oldEndIdx = oldCh.length - 1;
  // 新后
  let newEndIdx = newCh.length - 1;
  // 旧前节点
  let oldStartVnode = oldCh[oldStartIdx];
  // 新前节点
  let newStartVnode = newCh[newStartIdx]
  // 旧后节点
  let oldEndVnode = oldCh[oldEndIdx]
  // 新后节点
  let newEndVnode = newCh[newEndIdx]

  // 缓存 odlCh 的 key  {key: "第几项"}
  let keyMap = null;

  // while 循环
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    console.log('☆');
    // 跳过 已经加了undefined 标记 的项
    if (oldStartVnode == null || oldStartVnode == undefined) {
      oldStartVnode = oldCh[++oldStartIdx]

    } else if (oldEndVnode == null || oldEndVnode == undefined) {
      oldEndVnode = oldCh[--oldEndIdx]

    } else if (newStartVnode == null || newStartVnode == undefined) {
      newStartVnode = newCh[++newStartIdx]

    } else if (newEndVnode == null || newEndVnode == undefined) {
      newEndVnode = newCh[--newEndIdx]

    } else if (checkSameVnode(oldStartVnode, newStartVnode)) {
      
      // 新前 与 旧前  （新前，旧前 指针向后移动）
      patchVnode(oldStartVnode, newStartVnode)
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (checkSameVnode(oldEndVnode, newEndVnode)) {
      // 新后 与 旧后  (新后，旧后 指针向前移动)
      patchVnode(oldEndVnode, newEndVnode)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (checkSameVnode(oldStartVnode, newEndVnode)) {
      // 新后 与 旧前 （新后指针前移， 旧前指针后移）
      patchVnode(oldStartVnode, newEndVnode)

      // 把旧前（与新后一样）节点移动到旧后后面 （上面调用了patChVnode ，旧前已经合新后一样了）
      parentElm.insertBefore(oldStartVnode.elm, oldEndVnode.elm.nextSibling)

      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (checkSameVnode(oldEndVnode, newStartVnode)) {
      // 新前 与 旧后 （新前指针后移， 旧后指针前移）
      patchVnode(oldEndVnode, newStartVnode)

      // 移动旧后（与新前一样） 节点到旧前之前
      parentElm.insertBefore(oldEndVnode.elm, oldStartVnode.elm)

      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      // 四种命中查找 都没有命中
      // 第一次设置 key 的 map 
      // map 是 data.key 作为 keyMap的key.可能会存在 div.key === p.key 即 key相同，但是sel标签不一样
      if (!keyMap) {
        keyMap = {}
        for (let i = oldStartIdx; i <= oldEndIdx; i++) {
          const key = oldCh[i] ? oldCh[i].key : undefined;
          if (key !== undefined) {
            keyMap[key] = i
          }
        }
      }

      // 拿到keyMap 之后 比较 keyMap中是否有新前 存在， 
      // 存在  就 移动到旧前之前; 如果不存在就创建并移动到旧前之前
      const idxInOld = keyMap[newStartVnode.key]
      if (idxInOld === undefined) {
        // 不存在  把新前 创建为真实DOM 节点 并插入到 旧前之前
        // 此时新前 是 虚拟节点 需要创建
        parentElm.insertBefore(createElement(newStartVnode), oldStartVnode.elm)
      
      } else {
        // 存在 老虚拟节点中存在新前 ，那么patchVnode 改变存在的老虚拟节点之后  移动到旧前之前 
        // (并且 要设置 存在的老虚拟节点 为undefined; 不然while循环 时 指针会变化)
        const elmToMove = oldCh[idxInOld] // 获取 老虚拟节点中与新前一样的 节点

        // 判断 elmToMove 与 新前 newStartVnode 是不是同一个节点
        if(checkSameVnode(elmToMove, newStartVnode)){
          // 同一个节点，只是 key 与 sel 相同  patchVnode 修改 elmToMove 并上树
          patchVnode(elmToMove, newStartVnode)
          parentElm.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm)
          // 设置 原来 位置 为undefined
          oldCh[idxInOld] = undefined
        } else {
          // 不是同一个节点 只是key 相同
          // 创建 根据 新前虚拟节点 创建先的真实节点 ，并插入到 旧前的真实节点之前
          parentElm.insertBefore(createElement(newStartVnode), oldStartVnode.elm)
        }
      }

      // 让新前 指针后移
      newStartVnode = newCh[++newStartIdx]
    }
  }


  // 如果循环结束 还有 新节点
  // 把 新前与 新后之间的虚拟节点 添加到旧前 之前（或者旧后之后 ，此时 旧后再旧前的前面）
  if (newStartIdx <= newEndIdx) {    
    for (let i = newStartIdx; i <= newEndIdx; i++) {
      parentElm.insertBefore(createElement(newCh[i]), oldCh[oldStartIdx])
    }
  } else if (oldStartIdx <= oldEndIdx) {
    // 循环结束还有 旧节点
    // 把旧前 与旧后之间的虚拟节点 删除掉

    for (let i = oldStartIdx; i <= oldEndIdx; i++) {
      if (oldCh[i]) {
        try{
          parentElm.removeChild(oldCh[i].elm)
        } catch(err){
          console.log('parentElm.removeChild-err', err);
        }        
      }
    }
  }
}

// 是否是同一虚拟节点
function checkSameVnode (a, b) {
  return a.key === b.key && a.sel === b.sel
}