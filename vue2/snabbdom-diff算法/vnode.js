// 把存入的五个参数拼成对象返回
export default function (sel, data, children, text, elm){
  return {
    sel, data, children, text, elm, key: data.key
  }
}