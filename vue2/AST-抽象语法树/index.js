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