// 定义对象  并且属性是否可以被枚举
export const def = function (obj, key, value, enumerable) {
  Object.defineProperty(obj, key, {
    value,
    enumerable, // 是否可枚举
    writable: true, //可写
    configurable: true, //可删除
  })
}