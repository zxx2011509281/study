import h from './snabbdom-diff算法/h.js'
import patch from './snabbdom-diff算法/patch.js'

const vnode1 = h('div', {}, [
  h('li', { key: 'A' }, "A"),
  h('li', { key: 'B' }, "B"),  
  h('li', { key: 'C' }, "C"),
  h('li', { key: 'D' }, "D"),
  h('li', { key: 'E' }, "E"),
  
])

const vnode2 = h('div', {}, [
  h('li', { key: 'B' }, "BBBB"),
  // h('li', { key: 'Q' }, "Q"),
  // h('li', { key: 'A' }, "AAAA"),
  // h('li', {key: 'H'}, 'HHH'),
  // h('li', { key: 'E' }, "EEE"),  
])


const container = document.getElementById('app')
patch(container, vnode1)

document.querySelector('button').onclick = function () {
  patch(vnode1, vnode2)
}