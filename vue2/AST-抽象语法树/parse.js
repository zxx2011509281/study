

import parseAttrsString from './parseAttrsString'
// parse 主函数
export default function (templateString) {
  // 指针
  var index = 0
  // 剩余字符串
  var rest = templateString
  // 开始标记  new add (\s[\<]+)? 获取标签里面的属性 <div class="name">
  var startRegExp = /^\<([a-z]+[1-6]?)(\s[^\<]+)?\>/
  // 结束标记
  var endRegExp = /^\<\/([a-z]+[1-6]?)\>/
  // 文字内容标记
  var wordRegExp = /^([^\<]+)\<\/[a-z]+[1-6]?\>/

  // 栈1 存标签名
  var stack1 = []
  // 栈2 存内容
  var stack2 = [{children: []}]

  while (index < templateString.length - 1) {
    rest = templateString.slice(index)
    // 识别开始  字符是不是 开始标签
    if (startRegExp.test(rest)) {
      // 获取 标签名
      var tag = rest.match(startRegExp)[1]

      // 获取 属性 
      var attrsString = rest.match(startRegExp)[2]

      // 将开始标记 推入 栈1
      stack1.push(tag)
      // 将空数组 推入 栈2
      stack2.push({'tag': tag, children: [], attrs: parseAttrsString(attrsString)})

      // 指针后移 长度加 上标签名长度 和 < > 的长度 还要加上  属性的长度
      var attrsStringLength = attrsString? attrsString.length: 0
      index += tag.length + 2 + attrsStringLength
    }
    // 识别结束
    else if (endRegExp.test(rest)) {
      var tag = rest.match(endRegExp)[1]

      // 此时 tag 一定和 栈1的栈顶 是一样的
      var pop_tag = stack1.pop()
      if (tag === pop_tag) {
        var pop_arr = stack2.pop()
        if (stack2.length > 0) {
          // 如果栈顶 没有children 属性，就创建一个数组children
          if (!stack2[stack2.length - 1].hasOwnProperty('children')) {
            stack2[stack2.length - 1].children = []
          }
          stack2[stack2.length - 1].children.push(pop_arr)
        }

      } else {
        throw new Error(pop_tag + '标签没有封闭')
      }

      // 指针后移 长度加 上标签名长度 和 </ > 的长度
      index += tag.length + 3
    }
    // 识别是内容
    else if (wordRegExp.test(rest)) {
      let word = rest.match(wordRegExp)[1]
      // 不是全部 空字符的情况下
      if (!/\s+/.test(word)) {
        // 此时 改变 stack2 栈顶元素 children 属性
        stack2[stack2.length - 1].children.push({ 'text': word, type: 3 })
      }
      index += word.length
    }
    // 其他的算文字  <img />这些先不考虑，主要学习思想
    else {

      index++
    }
  }
  // 这里为啥没有剩余， 并且stack2初始要有一个children数组
  // 是因为 </div>   识别结束 碰到这里就直接 index +=6 。直接就结束循环了
  // 而上面 4 栈那里 是 ] 右中括号 就是最后一个。而index到不了最后一个，所以有剩余
  // 增加一个默认children 数组就是为了 存最后的数据 
  return stack2[0].children[0]
}