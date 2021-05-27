/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'


// 根据 id 获取页面DOM 元素的内容
const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

// 函数劫持 
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  /* istanbul ignore if */
  // 如果 el 是body 或者html 报错
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // render > template > el
  // resolve template/el and convert to render function
  // 如果没有 render 判断 template
  if (!options.render) {
    let template = options.template
    if (template) {
        // 如果template 是 #开头的字符串
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          // 获取 #id 对应的模板
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
        // 如果是元素节点
      } else if (template.nodeType) {
        // template 直接 得到 innerHTML
        template = template.innerHTML
      } else {
        // 非生产环境 会警告用户
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        // 直接返回（用户自己设置的模板）
        return this
      }
    } else if (el) {
      // template 不存在  template 等于 获取 el对应的DOM 元素 
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      // 把tempalte 转换为render 函数
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns  // 保存的是静态render ["_c('span',[_c('b',[_v("1")])])", "_c('strong',[_c('b',[_v("1")])])"]

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  // 如果有outerHTML配置直接返回
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    // 否则 创建一个div, 克隆 el 添加到div中，并返回 div的内容
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
