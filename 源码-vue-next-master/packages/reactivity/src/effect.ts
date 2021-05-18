import { TrackOpTypes, TriggerOpTypes } from './operations'
import { EMPTY_OBJ, isArray, isIntegerKey, isMap } from '@vue/shared'

// The main WeakMap that stores {target -> key -> dep} connections.
// Conceptually, it's easier to think of a dependency as a Dep class
// which maintains a Set of subscribers, but we simply store them as
// raw Sets to reduce memory overhead.
type Dep = Set<ReactiveEffect>
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()


export interface ReactiveEffect<T = any> {
  (): T
  _isEffect: true //是响应式
  id: number //effect 标识 用于区分effect
  active: boolean //effect 是否激活
  raw: () => T //保留effect 对应的原函数  创建effect是传入的fn
  deps: Array<Dep> // 持有当前 effect 的dep 数组
  options: ReactiveEffectOptions //保留用户的options 创建effect是传入的options
  allowRecurse: boolean
}

export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: (job: ReactiveEffect) => void // watchEffect 里面的flush 配置 : 'pre' | 'post' | 'sync' 组件更新 前|后|同步 运行侦听器副作用
  onTrack?: (event: DebuggerEvent) => void
  onTrigger?: (event: DebuggerEvent) => void
  onStop?: () => void
  allowRecurse?: boolean
}

export type DebuggerEvent = {
  effect: ReactiveEffect
  target: object
  type: TrackOpTypes | TriggerOpTypes
  key: any
} & DebuggerEventExtraInfo

export interface DebuggerEventExtraInfo {
  newValue?: any
  oldValue?: any
  oldTarget?: Map<any, any> | Set<any>
}

// effectStack 的目的是 effect中 包含effect 会造成 activeEffect 变化
/**
 *  effect(()=>{
 *        obj.age  ---> effect1
 *        effect(()=>{
 *            obj.nam ----> effect2
 *        })
 *        obj.sex ---> effect1 
 *  })
 *  如果没有 effectStack 栈结构保存 ，那么 在activeEffect 等于effect2 之后 ，obj.sex 会被收集到effect2中
 * */ 
const effectStack: ReactiveEffect[] = []
let activeEffect: ReactiveEffect | undefined

export const ITERATE_KEY = Symbol(__DEV__ ? 'iterate' : '')
export const MAP_KEY_ITERATE_KEY = Symbol(__DEV__ ? 'Map key iterate' : '')

export function isEffect(fn: any): fn is ReactiveEffect {
  return fn && fn._isEffect === true
}

export function effect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions = EMPTY_OBJ
): ReactiveEffect<T> {
  if (isEffect(fn)) {
    fn = fn.raw
  }
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) {
    effect()
  }
  return effect
}

export function stop(effect: ReactiveEffect) {
  if (effect.active) {
    cleanup(effect)
    if (effect.options.onStop) {
      effect.options.onStop()
    }
    effect.active = false
  }
}

let uid = 0

function createReactiveEffect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions
): ReactiveEffect<T> {
  const effect = function reactiveEffect(): unknown {
    if (!effect.active) {
      return options.scheduler ? undefined : fn()
    }
    if (!effectStack.includes(effect)) {
      cleanup(effect)
      try {
        enableTracking()
        effectStack.push(effect)
        activeEffect = effect
        return fn()
      } finally {
        effectStack.pop()
        resetTracking()
        // 如果 effectStack.length === 0 ，那么activeEffect 就为undefined。停止收集依赖了
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  } as ReactiveEffect
  effect.id = uid++
  effect.allowRecurse = !!options.allowRecurse
  effect._isEffect = true
  effect.active = true
  effect.raw = fn
  effect.deps = []
  effect.options = options
  return effect
}

// 清除依赖
function cleanup(effect: ReactiveEffect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

let shouldTrack = true
const trackStack: boolean[] = []

export function pauseTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = false
}

export function enableTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = true
}

export function resetTracking() {
  const last = trackStack.pop()
  shouldTrack = last === undefined ? true : last
}

export function track(target: object, type: TrackOpTypes, key: unknown) {
  // 如果 shouldTrack 为 false 或者 activeEffect 为空，则不进行依赖收集。
  if (!shouldTrack || activeEffect === undefined) {
    return
  }
  let depsMap = targetMap.get(target)
  //  targetMap 里面有没有该对象，没有新建 map
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  // 这个 map 有没有这个对象的对应 key 的 依赖 set 集合，没有则新建一个
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  // 对象对应的 key 的 依赖 set 集合也没有当前 activeEffect， 则把 activeEffect 加到 set 里面，同时把 当前 set 塞到 activeEffect 的 deps 数组
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
    // 开发模式 并且 配置了 onTrack  
    //  onTrack 将在响应式 property 或 ref 作为依赖项被追踪时被调用。
    if (__DEV__ && activeEffect.options.onTrack) {
      activeEffect.options.onTrack({
        effect: activeEffect,
        target,
        type,
        key
      })
    }
  }
}

export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
) {
  //  targetMap 中 获取  target 对应的 依赖map
  const depsMap = targetMap.get(target)
  // 如果没找到，说明没有被 收集过依赖 ，返回
  if (!depsMap) {
    // never been tracked
    return
  }

  // 设置一个 set 用来保存等会儿 需要执行 effect（函数) 的 类数组
  const effects = new Set<ReactiveEffect>()

  // 收集 等会儿 需要  执行 的 effect副作用 影响 到effects 中 
  // add 方法是将 effect 添加进不同分组的函数
  const add = (effectsToAdd: Set<ReactiveEffect> | undefined) => {
    if (effectsToAdd) {
      // 把 deps 中的 dep 都添加到 effects中
      effectsToAdd.forEach(effect => {
        if (effect !== activeEffect || effect.allowRecurse) {
          effects.add(effect)
        }
      })
    }
  }

  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared
    // trigger all effects for target
    // 正在清除集合,  触发目标的所有效果
    depsMap.forEach(add)
  } else if (key === 'length' && isArray(target)) {
    // 是数组  并且 key 为 length, 把 所有的副作用 到添加 到effects 里面
    // 如果 key 是 length , 而且 target 是数组，则会触发 key 为 length 的 effects ，以及 key 大于等于新 length的 effects， 因为这些此时数组长度变化了。
    // 类似于 list = [1,2] ==> list.length = 4
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= (newValue as number)) {
        add(dep)
      }
    })
  } else {
    //  其他情况 
    // schedule runs for SET | ADD | DELETE
    // key 不是undefined key存在 添加
    // 收集 对应项 的 dep 保存 到effects中
    if (key !== void 0) {
      add(depsMap.get(key))
    }

    // also run for iteration key on ADD | DELETE | Map.SET
    // proxy 比如 在baseHandlers里面  ownKeys 方法 会 track收集依赖 
    // track(target, TrackOpTypes.ITERATE, isArray(target) ? 'length' : ITERATE_KEY)
    // 收集的type 就是 ‘iterate’(迭代器)  如果是 数组 key 为length  否则 key 为 ITERATE_KEY
    switch (type) {
      // 添加
      case TriggerOpTypes.ADD:
        //target 不是 数组 
        if (!isArray(target)) {
          add(depsMap.get(ITERATE_KEY))
          // 如果 target  是一个Map 对象
          if (isMap(target)) {
            add(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        } else if (isIntegerKey(key)) {
          //  key 既是 字符串的数值，而且 type 为 新增 
          // 那么 就是 数组
          // new index added to array -> length changes
          // 添加到数组的新索引->长度更改
          add(depsMap.get('length'))
        }
        break
        // 删除
      case TriggerOpTypes.DELETE:
        if (!isArray(target)) {
          add(depsMap.get(ITERATE_KEY))
          if (isMap(target)) {
            add(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        }
        break
        // 修改
      case TriggerOpTypes.SET:
        if (isMap(target)) {
          add(depsMap.get(ITERATE_KEY))
        }
        break
    }
  }

  // 执行 副作用函数
  const run = (effect: ReactiveEffect) => {
    // 如果是开发环境   并且  配置了onTrigger
    // onTrigger 将在依赖项变更导致副作用被触发时被调用。
    if (__DEV__ && effect.options.onTrigger) {
      effect.options.onTrigger({
        effect,
        target,
        key,
        type,
        newValue,
        oldValue,
        oldTarget
      })
    }
    // watchEffect 里面的flush 配置 : 'pre' | 'post' | 'sync' 组件更新 前|后|同步 运行侦听器副作用
    if (effect.options.scheduler) {
      effect.options.scheduler(effect)
    } else {
      // 执行 副作用
      effect()
    }
  }

  // 最后 执行 effects中的  副作用 effect
  effects.forEach(run)
}
