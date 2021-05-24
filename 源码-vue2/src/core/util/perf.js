import { inBrowser } from './env'

export let mark
export let measure

// performance 提供对当前页面性能相关信息的访问
// 可以通过调用window.performance只读属性来获得此类型的对象。
if (process.env.NODE_ENV !== 'production') {
  const perf = inBrowser && window.performance
  /* istanbul ignore if */
  if (
    perf &&
    perf.mark &&  // 使用给定名称timestamp在浏览器的性能条目缓冲区中创建一个。
    perf.measure && // timestamp在浏览器的性能输入缓冲区中的两个指定标记（分别称为开始标记和结束标记）之间创建一个命名。
    perf.clearMarks && // 从浏览器的性能输入缓冲区中删除给定标记。
    perf.clearMeasures // 从浏览器的性能输入缓冲区中删除给定的度量。
  ) {
    mark = tag => perf.mark(tag)
    measure = (name, startTag, endTag) => {
      perf.measure(name, startTag, endTag)
      perf.clearMarks(startTag)
      perf.clearMarks(endTag)
      // perf.clearMeasures(name)
    }
  }
}
