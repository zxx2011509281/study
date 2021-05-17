
// 把属性转换为数组
// class="aa bb cc" id="myid" ====> [{name: 'class', value: 'aa bb cc'}, {name: 'id', value: 'myid'}]
export default function (attrsString) {
  // 如果没有直接返回空数组
  if (attrsString == undefined) return []

  // 当前是否再引号里面
  var isYinhao = false
  // 断点
  var point = 0
  // 结果
  var result = []
  // 遍历
  for (let i = 0; i < attrsString.length; i++) {
    var char = attrsString[i]
    // 碰到引号 把标记 取反
    if (char === '"') {
      isYinhao = !isYinhao

    }
    // 遇见 空格 并且 不 在引号中 
    else if (char == ' ' && !isYinhao) {
      // 获取属性 class="aa bb cc"
      var item = attrsString.slice(point, i);
      // 不是全部空格的情况先 结果数组 推入
      if(!/^\s*$/.test(item)){
        result.push(item.trim())
        point = i
      }

    }
  }
  // 循环结束之后还剩一个 原因是 <div class="aa bb cc" id="myId">   myId与>没有空格，所以没有进入判断语句中
  result.push(attrsString.slice(point).trim())



  // 映射成对象
  result = result.map(item=>{
    // 拆分=
    const o = item.match(/^(.+)="(.+)"$/)
    return {
      name: o[1],
      value: o[2]
    }
  })

  console.log('rrrrrrr', result);
  return result
}