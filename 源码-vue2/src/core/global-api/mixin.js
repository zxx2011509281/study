/* @flow */

import { mergeOptions } from '../util/index'


export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    // 把混入 的mixin 与 Vue.options 合并 生成 新的 Vue.options
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
