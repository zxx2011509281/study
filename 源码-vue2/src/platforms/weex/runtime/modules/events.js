/* @flow */

import { updateListeners } from 'core/vdom/helpers/update-listeners'

let target: any

function createOnceHandler(event, handler, capture) {
    const _target = target // save current target element in closure
    return function onceHandler() {
        const res = handler.apply(null, arguments)
        if (res !== null) {
            remove(event, onceHandler, capture, _target)
        }
    }
}

function add(
    event: string,
    handler: Function,
    capture: boolean,
    passive ? : boolean,
    params ? : Array < any >
) {
    if (capture) {
        console.log('Weex do not support event in bubble phase.')
        return
    }
    target.addEvent(event, handler, params)
}

function remove(
    event: string,
    handler: any,
    capture: any,
    _target ? : any
) {
    (_target || target).removeEvent(event)
}

// 通过对比两个VNode的事件对象，来决定绑定原生DOM事件还是解绑原生DOM事件。
function updateDOMListeners(oldVnode: VNodeWithData, vnode: VNodeWithData) {
    // 如果两个Vnode中事件对象都不存在，
    // 说明上一次没有绑定任何事件， 这一次元素更新也没有新增事件绑定
    if (!oldVnode.data.on && !vnode.data.on) {
        return
    }
    // 获取新老Vnode上的事件
    const on = vnode.data.on || {}
    const oldOn = oldVnode.data.on || {}
        // vnode.elm上保存vnode所对应的DOM元素
    target = vnode.elm
        // 更新事件监听器，通过对比on 与 oldOn. 判断调用add方法还是 remove方法执行绑定事件还是解绑事件，
    updateListeners(on, oldOn, add, remove, createOnceHandler, vnode.context)
    target = undefined
}

export default {
    create: updateDOMListeners,
    update: updateDOMListeners
}