/* @flow */

import { emptyNode } from 'core/vdom/patch'
import { resolveAsset, handleError } from 'core/util/index'
import { mergeVNodeHook } from 'core/vdom/helpers/index'

export default {
    create: updateDirectives,
    update: updateDirectives,
    destroy: function unbindDirectives(vnode: VNodeWithData) {
        updateDirectives(vnode, emptyNode)
    }
}

function updateDirectives(oldVnode: VNodeWithData, vnode: VNodeWithData) {
    if (oldVnode.data.directives || vnode.data.directives) {
        _update(oldVnode, vnode)
    }
}

function _update(oldVnode, vnode) {
    const isCreate = oldVnode === emptyNode // 是否是新创建的节点
    const isDestroy = vnode === emptyNode // 是否新虚拟节点不存在

    // normalizeDirectives 将模板中 使用的 指令  从用户注册的 自定义指令集合中 取出来
    const oldDirs = normalizeDirectives(oldVnode.data.directives, oldVnode.context) // 旧的指令集合
    const newDirs = normalizeDirectives(vnode.data.directives, vnode.context) // 新的指令集合

    const dirsWithInsert = [] // 保存需要触发inserted 指令钩子的指令列表
    const dirsWithPostpatch = [] // 保存需要触发 componentUpdated 钩子函数的指令列表

    let key, oldDir, dir
        // 循环新的指令集合
    for (key in newDirs) {
        oldDir = oldDirs[key]
        dir = newDirs[key]
            // 如果旧指令不存在，说明改指令首次绑定到元素
        if (!oldDir) {
            // 新指令  触发 bind 函数
            callHook(dir, 'bind', vnode, oldVnode)
                // 如果有inserted 方法 添加到dirsWithInsert。等待执行
            if (dir.def && dir.def.inserted) {
                dirsWithInsert.push(dir)
            }
        } else {
            // 已经存在的指令 更新即可
            dir.oldValue = oldDir.value
            dir.oldArg = oldDir.arg
                // 触发update钩子函数
            callHook(dir, 'update', vnode, oldVnode)
            if (dir.def && dir.def.componentUpdated) {
                // 如果有componentUpdated方法 保存到 dirsWithPostpatch 等待执行
                dirsWithPostpatch.push(dir)
            }
        }
    }

    // 执行 dirsWithInsert 
    if (dirsWithInsert.length) {
        // callInsert 函数 会等到执行时， 才会依次调用每个指令的inserted方法
        const callInsert = () => {
                for (let i = 0; i < dirsWithInsert.length; i++) {
                    callHook(dirsWithInsert[i], 'inserted', vnode, oldVnode)
                }
            }
            // 如果新 创建的 元素
        if (isCreate) {
            // mergeVNodeHook 可以将 一个钩子函数 与 虚拟节点 现有的 钩子函数合并。
            // 这样 钩子函数的执行 推迟到被绑定的 元素插入 到父节点之后进行
            mergeVNodeHook(vnode, 'insert', callInsert)
        } else {
            // 如果不是新的元素， 直接执行 即可
            callInsert()
        }
    }

    // componentUpdated 也需要将指令推迟到 指令所在组件的Vnode及其子Vnode全部更新之后调用
    if (dirsWithPostpatch.length) {
        // 虚拟DOM更新前 会触发 prepatch钩子函数
        // 虚拟DOM更新中 会触发 update钩子函数
        // 虚拟DOM更新后 会触发 postpatch钩子函数
        mergeVNodeHook(vnode, 'postpatch', () => {
            for (let i = 0; i < dirsWithPostpatch.length; i++) {
                callHook(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode)
            }
        })
    }

    // 如果是新创建，是不需要解绑的。
    if (!isCreate) {
        // 旧的存在，新的不存在。那么调用callHook 执行upbind方法即可
        for (key in oldDirs) {
            if (!newDirs[key]) {
                // no longer present, unbind
                callHook(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy)
            }
        }
    }
}

const emptyModifiers = Object.create(null)

function normalizeDirectives(
    dirs: ? Array < VNodeDirective > ,
    vm : Component
): {
    [key: string]: VNodeDirective } {
    const res = Object.create(null)
    if (!dirs) {
        // $flow-disable-line
        return res
    }
    let i, dir
    for (i = 0; i < dirs.length; i++) {
        dir = dirs[i]
        if (!dir.modifiers) {
            // $flow-disable-line
            dir.modifiers = emptyModifiers
        }
        res[getRawDirName(dir)] = dir
        dir.def = resolveAsset(vm.$options, 'directives', dir.name, true)
    }
    // $flow-disable-line
    return res
}

function getRawDirName(dir: VNodeDirective): string {
    return dir.rawName || `${dir.name}.${Object.keys(dir.modifiers || {}).join('.')}`
}

function callHook(dir, hook, vnode, oldVnode, isDestroy) {
    const fn = dir.def && dir.def[hook]
    if (fn) {
        try {
            fn(vnode.elm, dir, vnode, oldVnode, isDestroy)
        } catch (e) {
            handleError(e, vnode.context, `directive ${dir.name} ${hook} hook`)
        }
    }
}