/* @flow */

import { warn } from './debug'
import { observe, toggleObserving, shouldObserve } from '../observer/index'
import {
  hasOwn,
  isObject,
  toRawType,
  hyphenate,
  capitalize,
  isPlainObject
} from 'shared/util'

type PropOptions = {
  type: Function | Array<Function> | null,
  default: any,
  required: ?boolean,
  validator: ?Function
};

export function validateProp (
  key: string, // 属性名
  propOptions: Object, // 子组件中用户设置的props 选项
  propsData: Object, // 父组件或用户提供 的props 数据
  vm?: Component // this别名 实例
): any {
  const prop = propOptions[key] // 保存当前的prop
  const absent = !hasOwn(propsData, key) // 当前的props属性 缺席 ，不存在
  let value = propsData[key] //获取 prop具体的值
  // boolean casting
  // 处理布尔类型
  const booleanIndex = getTypeIndex(Boolean, prop.type)
  if (booleanIndex > -1) {
    // 如果 prop不存在 并没有默认值 ，那么为 false
    if (absent && !hasOwn(prop, 'default')) {
      value = false
    } else if (value === '' || value === hyphenate(key)) {
      // hyphenate aB驼峰转换回去a-b （normalizeProps初始化时会把key转为驼峰）
      // key 存在 ，当 value为空字符 或 value与key相等 （a==a, userName=user-name）
      // only cast empty string / same name to boolean if
      // boolean has higher priority
      // 布尔值具有更高的优先级的情况下， 仅将空字符串/相同名称强制转换为布尔值
      const stringIndex = getTypeIndex(String, prop.type)
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true
      }
    }
  }
  // check default value
  // props 的值 为undefined的情况下
  if (value === undefined) {
    // 获取默认值
    value = getPropDefaultValue(vm, prop, key)
    // since the default value is a fresh copy,
    // make sure to observe it.
    const prevShouldObserve = shouldObserve
    // 设置为 可以响应式
    toggleObserving(true)
    // 把 value默认值 转换为 响应式
    observe(value)
    // 重置 是否可以响应式的 状态
    toggleObserving(prevShouldObserve)
  }
  if (
    process.env.NODE_ENV !== 'production' &&
    // skip validation for weex recycle-list child component props
    !(__WEEX__ && isObject(value) && ('@binding' in value))
  ) {
    assertProp(prop, key, value, vm, absent)
  }
  return value
}

/**
 * Get the default value of a prop.
 */
function getPropDefaultValue (vm: ?Component, prop: PropOptions, key: string): any {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  const def = prop.default
  // warn against non-factory defaults for Object & Array
  if (process.env.NODE_ENV !== 'production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    )
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

/**
 * Assert whether a prop is valid.
 */
 function assertProp(
  prop: PropOptions, // props选项
  name: string, // props中prop选项的key
  value: any, // prop数据 (propData)
  vm: ? Component, // 上下文
  absent : boolean // prop数据中不存在 key属性
) {
  // 如果 设置了必填项 并且 没有 key 属性 ，控制台 警告 
  if (prop.required && absent) {
      warn(
          'Missing required prop: "' + name + '"',
          vm
      )
      return
  }
  //  如果value 不存在 并且 没有设置 required  是合法的情况，直接返回 undefined即可
  //  null == undefined 为 true
  if (value == null && !prop.required) {
      return
  }
  let type = prop.type
      // valid 默认 为 false , 或者 设置type 为 true时默认为true
  let valid = !type || type === true
      // 保存 type的列表 ，当校验失败，在控制台打印警告时， 可以将变量 expectedTypes中保存的类型打印出来
  const expectedTypes = []
  if (type) {
      // 把type 转换 数组
      if (!Array.isArray(type)) {
          type = [type]
      }
      // 
      for (let i = 0; i < type.length && !valid; i++) {
          // assertType 检验value 。返回一个对象{valid: true, expectedType: "Boolean"}
          // valid表示 是否校验成功  expectedType 表示类型
          const assertedType = assertType(value, type[i], vm)
          expectedTypes.push(assertedType.expectedType || '')
          valid = assertedType.valid
      }
  }

  // 循环结束后， haveExpectedTypes 不存在，那么校验失败 警告
  const haveExpectedTypes = expectedTypes.some(t => t)
  if (!valid && haveExpectedTypes) {
      warn(
          getInvalidTypeMessage(name, value, expectedTypes),
          vm
      )
      return
  }
  // 获取 自定义验证函数 
  // 如果设置了 就执行。猴子 调用warn 打印警告
  const validator = prop.validator
  if (validator) {
      if (!validator(value)) {
          warn(
              'Invalid prop: custom validator check failed for prop "' + name + '".',
              vm
          )
      }
  }
}

const simpleCheckRE = /^(String|Number|Boolean|Function|Symbol|BigInt)$/

function assertType (value: any, type: Function, vm: ?Component): {
  valid: boolean;
  expectedType: string;
} {
  let valid
  const expectedType = getType(type)
  if (simpleCheckRE.test(expectedType)) {
    const t = typeof value
    valid = t === expectedType.toLowerCase()
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value)
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value)
  } else {
    try {
      valid = value instanceof type
    } catch (e) {
      warn('Invalid prop type: "' + String(type) + '" is not a constructor', vm);
      valid = false;
    }
  }
  return {
    valid,
    expectedType
  }
}

const functionTypeCheckRE = /^\s*function (\w+)/

/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType (fn) {
  const match = fn && fn.toString().match(functionTypeCheckRE)
  return match ? match[1] : ''
}

function isSameType (a, b) {
  return getType(a) === getType(b)
}

function getTypeIndex (type, expectedTypes): number {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (let i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}

function getInvalidTypeMessage (name, value, expectedTypes) {
  let message = `Invalid prop: type check failed for prop "${name}".` +
    ` Expected ${expectedTypes.map(capitalize).join(', ')}`
  const expectedType = expectedTypes[0]
  const receivedType = toRawType(value)
  // check if we need to specify expected value
  if (
    expectedTypes.length === 1 &&
    isExplicable(expectedType) &&
    isExplicable(typeof value) &&
    !isBoolean(expectedType, receivedType)
  ) {
    message += ` with value ${styleValue(value, expectedType)}`
  }
  message += `, got ${receivedType} `
  // check if we need to specify received value
  if (isExplicable(receivedType)) {
    message += `with value ${styleValue(value, receivedType)}.`
  }
  return message
}

function styleValue (value, type) {
  if (type === 'String') {
    return `"${value}"`
  } else if (type === 'Number') {
    return `${Number(value)}`
  } else {
    return `${value}`
  }
}

const EXPLICABLE_TYPES = ['string', 'number', 'boolean']
function isExplicable (value) {
  return EXPLICABLE_TYPES.some(elem => value.toLowerCase() === elem)
}

function isBoolean (...args) {
  return args.some(elem => elem.toLowerCase() === 'boolean')
}
