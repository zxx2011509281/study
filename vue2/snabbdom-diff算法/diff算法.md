最近学了一下snabbdom的diff算法，记录一下


`由于是简易版所有h函数只接受三种形式, 第三个参数只能是文字，数组，或者h函数`
```
h('div', { key: 'A' }, "A")
h('div', { key: 'A' }, [h('li',{}, 'a'), h('li, {}, [])])
h('div', { key: 'A' }, h('div', {} , X))
```

先说一下大概有哪些函数和一些基本概念

>虚拟节点： 假的节点，便于diff比较，比真实dom开销小
有以下属性：{sel: '', data:'', children:'', text: '', elm: '', key: ''}
* sel : 选择的节点名称
* data: 里面挂载的其他属性,比如style，disabled等
* children: 子虚拟节点
* text: 文本内容
* elm:真实的DOM元素
* key: key唯一值


>Vnode函数： 传入五个参数 返回 虚拟节点

>h函数： 里面调用了Vnode函数 ，创建了虚拟节点

>createElement 把虚拟节点 创建 为真实节点

>patch 函数 做diff算法，最小代价更新旧节点为新节点

>patchVnode 函数  是patch函数中 同一节点的算法 单独提出来

> updateChildren 函数 是 实现patch 函数中最复杂（新老节点都有children）的四种命中算法

### 逻辑
![patch函数调用 （oldVnode, newVnode）.png](https://upload-images.jianshu.io/upload_images/4642829-3b35a5205d2c8807.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

1. 首先我们要判断oldVnode是不是虚拟节点，如果不是，那么就是首次挂载上树，需要把oldVnode包装成虚拟节点
2. 如果是虚拟节点，我接下来要通过 sel和key 判断新老虚拟节点是不是同一节点，如果不是，那么暴力删除老节点，并插入新节点
3. 如果是同一节点，要判断是不是同一个对象（内存地址一样的情况），如果是同一对象，那么return，啥都不用做
4. 如果不是同一对象接下来判断 新节点有没有 text 属性， 如果有，又要分两种，新老节点text相同，直接return。不同，就把新节点的text替换 老节点的elm(真实节点)的innerText;
5. 如果新节点没有text属性，那么说明新节点有children属性，如果老节点没有children属性（有text属性），情况老节点的text内容，并把新节点的children添加到老节点的elm中。
6. 如果老节点和新节点 都有children属性，此时是最复杂的情况，需要用到四种命中查找方法。

### 四种命中查找算法
这里会创建四个指针 分别是旧节点 的开始和结束，新节点的开始和结束（旧前， 旧后， 新前， 新后）
![image.png](https://upload-images.jianshu.io/upload_images/4642829-667f107ff03671a1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

比如上图 就节点的children有四个li, 新节点有三个li;
旧前就指向旧节点第一个li,旧后指向旧节点最后一个li；新节点一样；
在算法中 前后指针会相互往中间靠拢，直到循环结束；

在循环中比较 用四种命中查找
```
  while(新前 <= 新后 && 旧前 <= 旧后){}
```
**判断方法** 按顺序比较
① 新前与旧前
② 新后与旧后
③ 新后与旧前
④ 新前与旧后
⑤ 都不符合

**结果**
1. 如果在while中 第一种 符合 比如栗子中的 h('li', {key: 'A'}, '') 相同 了。那么 命中的指针就要后移（新前和就前）,然后开始下一次循环
![image.png](https://upload-images.jianshu.io/upload_images/4642829-8ef7802480694d9e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
2. 第二种情况， 命中的新后和旧后指针分别向前移
3. 第三种情况，旧前说指向的节点移动到旧后的后面， 并且把旧前指向的节点改为undefined
![image.png](https://upload-images.jianshu.io/upload_images/4642829-77d0380f238c3481.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
比如此时 1，2中没命中，3中命中了。新后与旧前相同了
![image.png](https://upload-images.jianshu.io/upload_images/4642829-508006a93eead79d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
4. 第四种情况，在旧前之前创建一个节点（新前所指向的节点），并把旧后指向的节点改为undefined;

5. 如果都没有命中，那么循环 旧前与旧后 之间的虚拟节点，判断里面是否存在  新前指向的节点， 1️⃣如果存在，把对应的 旧节点移动到 旧前之前。2️⃣ 如果不存在，那么创建新前对应的节点并 插入到 旧 前之前。 （循环之后需要把新前的 指针后移一位） 

以上是while循环中四种命中和其他的判断，当循环结束之后。需要判断 是旧节点还有 剩余 还是 新节点还有剩余

`壹`. 如果 旧节点还有剩余，那么把旧前和旧后 之间的节点全部删除掉
`贰`. 如果 新节点还有剩余， 把新前和新后 之间的节点插入旧前之前（因为while循环结束 所以旧前 位置再 旧后 之后了）

### 下面是源码
vnode.js
```
// 把存入的五个参数拼成对象返回
export default function (sel, data, children, text, elm){
  return {
    sel, data, children, text, elm, key: data.key
  }
}
```
h.js
```
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
```
createElement.js
```
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
```
patch.js
```

import vnode from './vnode'
import createElement from './createElement'
import patchVnode from './patchVnode'

// 对比 新老虚拟节点 diff 算法 (更新老虚拟节点)
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
```
patchVnode.js
```


import vnode from './vnode'
import createElement from './createElement'
import updateChildren from './updateChildren.js'

// patch函数中 同一节点的 算法
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
```
updateChildren.js
```
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
```

测试脚本
```
import h from './snabbdom/h.js'
import patch from './snabbdom/patch.js'

const vnode1 = h('div', {}, [
  h('li', { key: 'A' }, "A"),
  h('li', { key: 'B' }, "B"),  
  h('li', { key: 'C' }, "C"),
  h('li', { key: 'D' }, "D"),
  h('li', { key: 'E' }, "E"),
  
])

const vnode2 = h('div', {}, [
  h('li', { key: 'B' }, "B"),
  h('li', { key: 'Q' }, "Q"),
  h('li', { key: 'A' }, "AAAA"),
  h('li', {key: 'H'}, 'HHH'),
  h('li', { key: 'E' }, "EEE"),  
])


const container = document.getElementById('app')
patch(container, vnode1)

document.querySelector('button').onclick = function () {
  patch(vnode1, vnode2)
}
```




