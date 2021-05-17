import Observer from './Observer'

// 入口文件 实现动态监听  
// 创建observe 函数
export default function observe (value) {
  //如果 value 不是对象， 直接返回（只能为对象服务）
  if (typeof value !== 'object') return;
  // 定义 ob
  var ob;
  // __ob__ 存储 Observer类 的实例
  if (typeof value.__ob__ !== 'undefined') {
    ob = value.__ob__;
  } else {
    ob = new Observer(value);
  }

  return ob;
}