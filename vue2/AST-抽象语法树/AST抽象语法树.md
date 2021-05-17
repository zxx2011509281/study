### 抽象语法树
在[计算机科学](https://baike.baidu.com/item/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%A7%91%E5%AD%A6)中，抽象语法树（Abstract Syntax Tree，AST），或简称**[语法树](https://baike.baidu.com/item/%E8%AF%AD%E6%B3%95%E6%A0%91/7031301)**（Syntax tree），是[源代码](https://baike.baidu.com/item/%E6%BA%90%E4%BB%A3%E7%A0%81)[语法](https://baike.baidu.com/item/%E8%AF%AD%E6%B3%95)结构的一种抽象表示。它以树状的形式表现[编程语言](https://baike.baidu.com/item/%E7%BC%96%E7%A8%8B%E8%AF%AD%E8%A8%80)的语法结构，树上的每个节点都表示源代码中的一种结构

栗子：
```
  <div class="box">
    <h3 class="title">我是一个标题</h3>
    <ul>
      <li v-for="(item, index) in arr" :key="index">{{item}}</li>
    </ul>
  </div>
```
转换成抽象树 （本质上就是一个js对象）
```
{
      tag: 'div',
      attrs: [{name: 'class', value: 'box'}],
      type: 1,
      children: [
        {
          tag: 'h3',
          attrs: [{name: 'class', value: 'title'}],
          type: 1,
          children: [
            {text: '我是一个标题', type: 3}
          ],
        },
        {
          tag: 'ul',
          attrs: [],
          type: 1,
          children: [
            {
              tag: 'li',
              type: 1,
              for: 'arr',
              key: 'index',
              alias: 'item',
              children: [
                      ...
              ]
            }
          ]
        }
      ]
    }

```

### 抽象语法树和虚拟节点区别
![image.png](https://upload-images.jianshu.io/upload_images/4642829-7cbcce71144146e9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### 储备算法

1. 找出以下字符串中，连续重复次数最多的字符
'aaaaaaaaaabbbbaaaaacccddbbbeeessfffffffffffffffffffffffffwwwwwwwwww'

这里我们用指针思想解决
![image.png](https://upload-images.jianshu.io/upload_images/4642829-c127e93678963110.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



```
      var str =
        'aaaaaaaaaabbbbaaaaacccddbbbeeessfffffffffffffffffffffffffwwwwwwwwww';
      // 指针
      var i = 0;
      var j = 1;

      // 当前重复最多的次数
      var maxRepeat = 0;
      // 重复最多的字符串
      var maxStr = '';

      // 循环 当i还在范围内
      while (i <= str.length - 1) {
        // 两个指针指向的字符 不相同
        if (str[i] !== str[j]) {
          // 与前面保存的最大重复次数比较， 更大的话重新赋值
          if (j - i > maxRepeat) {
            maxRepeat = j - i;
            maxStr = str[i];
          }
          // i移动到j的位置
          i = j;
        }
        // 如果相同的话 i不同，所以不用写

        // j每次都要后移
        j++;
      }
      console.log(`重复最多的字符是：${maxStr}，重复次数为：${maxRepeat}`);
      // 重复最多的字符是：f，重复次数为：25
```
2. 递归算法
输出斐波那契数列前10项，1，1，2，3，5，8，13，21，34，55.

这个基本大家都会，就直接上代码了
```
function fib(n) {
        return n == 0 || n == 1 ? 1 : fib(n - 1) + fib(n - 2);
}
fib(6) // 13
```
然后假如我们是要求前10项之和，我们就可以优化一下。比如算fib(10)的时候，前面我们算过fib(9)和fib(8)，直接取就行了。不用再算一遍了。
```
      var cache = {};
      function fib(n) {
        if (cache.hasOwnProperty(n)) {
          return cache[n];
        }
        var v = n == 0 || n == 1 ? 1 : fib(n - 1) + fib(n - 2);
        cache[n] = v;
        return v;
      }
      var num = 0;
      for (let i = 0; i < 9; i++) {
        num += fib(i);
      }
      console.log('num', num); // 88
```

3. 递归 多维数组转嵌套对象 
数组：[1, 2, [3, [4, 5], 6], 7, [8], 9]
对象：
```

{
  children: [
    { value: 1 },
    { value: 2 },
    {
      children: [
        { value: 3 },
        { children: [{ value: 4 }, { value: 5 }] },
        { value: 6 },
      ],
    },
    { value: 7 },
    { children: [{ value: 8 }] },
    { value: 9 },
  ],
};
```
`小技巧： 出现了”规则复现“ 就想到用递归`
```

var arr = [1, 2, [3, [4, 5], 6], 7, [8], 9];
//第一种 转换函数
function convert(arr) {
  // 结果数组
  var result = [];
  // 遍历
  for (let i = 0; i < arr.length; i++) {
    var item = arr[i];
    if (typeof item === 'number') {
      result.push({
        value: item,
      });
    } else if (Array.isArray(item)) {
      result.push({
        children: convert(item),
      });
    }
  }
  return result;
}
// 第二种  转换函数
function convert(item) {
  if (typeof item == 'number') {
    return { value: item };
  } else if (Array.isArray(item)) {
    return {
      children: item.map((it) => convert(it)),
    };
  }
}
console.log('convert', convert(arr));
```
![image.png](https://upload-images.jianshu.io/upload_images/4642829-a73e59fbe0f00ddf.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

4、栈（后进先出 特点） `对于字符串不建议用递归，用指针比较好`
smartRepeat函数，实现：
* 3[abc]变为 abcabcabc
* 3[2[a]2[b]] 变为 aabbaabbaabb
* 2[1[a]3[b]2[3[c]4[d]]] 变为 abbbcccddddcccddddabbbcccddddcccdddd
`数字和字母不能混用，字母必须在[]中,且[]左边数字最小为1. 数字和字母可以多位，比如 12[abc]`

思路：
![image.png](https://upload-images.jianshu.io/upload_images/4642829-cdccfb320f3edadc.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

```
function smartRepeat(templateStr) {
  //指针
  var index = 0;
  // 栈1 存数字  栈2 存字符型
  var stack1 = [];
  var stack2 = [];

  // 剩余部分
  var rest = templateStr;

  // 最后一项单独处理 所有不用 <=
  while (index < templateStr.length - 1) {
    rest = templateStr.slice(index);
    //判断剩余部分 是不是以 数字 和 [ 开头
    if (/^\d+\[/.test(rest)) {
      // 得到数字 （现在是字符串）
      var times = rest.match(/^(\d+)\[/)[1];

      // 指针移动 数字的长度 还要加上 左括号的 长度
      index += times.length + 1;
      // 栈1 和 栈2 压栈
      stack1.push(+times);
      stack2.push('');
    }
    // 剩余部分是 字母和 ] 开始
    else if (/^[a-zA-Z]+\]/.test(rest)) {
      // 得到字母
      var words = rest.match(/^([a-zA-Z]+)\]/)[1];

      // 栈2 栈顶  修改 为当前字母
      stack2[stack2.length - 1] = words;

      // 由于] 要单独处理，所有这里指针只移动 字母的长度即可
      index += words.length;
    }
    // 剩余 部分是 ] 开始
    else if (/^\]/.test(rest)) {
      // 栈1 ，栈2 弹栈 并且 处理后 拼接到 栈2 的 新栈顶
      var times = stack1.pop();
      var words = stack2.pop();
      stack2[stack2.length - 1] += words.repeat(times);

      index++;
    }
  }
  // while 循环结束
  return stack2[0].repeat(stack1[0]);
}
console.log(smartRepeat('12[2[aab]2[c]]'));
// aabaabccaabaabccaabaabccaabaabccaabaabccaabaabccaabaabccaabaabccaabaabccaabaabccaabaabccaabaabcc
```


#### 手写 AST 抽象树
思路就和上面4的解法差不多。
```
var templateString = `<div>
  <h1>我是标题</h1>
  <ul>
    <li>A</li>
    <li>B</li>
    <li>C</li>
    <li>D</li>
  </ul>
  <div>
    <div>哈哈</div>
  </div>
</div>`
```
* 遇到 <div> 把它放入栈1， 栈2 放入一个空数组
* 遇到<h1> 也把它放入栈1，栈2 放入一个空数组。
* 遇到"我是标题"，栈2 的最后一个空数组中放入。
  >栈1： <div>  <h1>
    栈2：[]    [{text:"我是标题", type: 3}]

* 遇到</h1>，栈1弹栈，栈2弹栈。并且把弹栈的数据整合到栈2的栈顶
.........

最后我们要变成的形式就是开始说的那种，不过我们先做简单的
```
  {
      tag: 'div',
      attrs: [{name: 'class', value: 'box'}],
      type: 1,
      children: [
        {
          tag: 'h3',
          attrs: [{name: 'class', value: 'title'}],
          type: 1,
          children: [
            {text: '我是一个标题', type: 3}
          ],
        },       
      ]
    }

```
我们先来处理没有class等属性的情况
index.js
```
import parse from './parse'

var templateString = `<div>
  <h1>我是标题</h1>
  <ul>
    <li>A</li>
    <li>B</li>
    <li>C</li>
    <li>D</li>
  </ul>
  <div>
    <div>哈哈</div>
  </div>
</div>`
console.log(parse(templateString));
```
parse.js
```


// parse 主函数
export default function (templateString) {
  // 指针
  var index = 0
  // 剩余字符串
  var rest = templateString
  // 开始标记 
  var startRegExp = /^\<([a-z]+[1-6]?)\>/
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

      // 将开始标记 推入 栈1
      stack1.push(tag)
      // 将空数组 推入 栈2
      stack2.push({'tag': tag, children: []})

      // 指针后移 长度加 上标签名长度 和 < > 的长度
      index += tag.length + 2
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

```

ok，现在我们来处理 class等属性的情况

首先我们处理开始正则
```
  // 开始标记  new add (\s[\<]+)? 获取标签里面的属性 <div class="name">
  var startRegExp = /^\<([a-z]+[1-6]?)(\s[^\<]+)?\>/
```

然后再开始标签里面处理, 添加一个attrs对象
```
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
```
parseAttrsString函数是用来专门处理属性转换为数组的，
比如class="aa bb cc" id="myid" ====> [{name: 'class', value: 'aa bb cc'}, {name: 'id', value: 'myid'}]。 代码下面有，就不专门在贴一下次了



### 结束了。以下是完整代码
index.js
```
import parse from './parse'

var templateString = `<div>
  <h1 class="aa bb cc" id="myId">我是标题</h1>
  <ul>
    <li>A</li>
    <li>B</li>
    <li>C</li>
    <li>D</li>
  </ul>
  <div>
    <div>哈哈</div>
  </div>
</div>`
console.log(parse(templateString));
```

parse.js
```


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
```

parseAttrsString.js
```

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
```







