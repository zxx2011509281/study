//  reactive 会中 把对象 get，set劫持。
// get中 如果有获取 会把依赖保存到环境变量 targetMap中
// set 修改是 会 触发 targetMap中的依赖并执行
// 而effect 会在开始就执行一次，由于effect中 是依赖reactive中的  数据变化， 那么
//  就会触发get方法，然后把effect中的依赖收集到 targetMap中。在set变化是 调用收集到的依赖

function reactive (target) {
  // 只读属性那么 直接返回
  if (target && target["__v_isReadonly" /* IS_READONLY */]) {
    return target;
  }
  return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
  // const reactiveMap = new WeakMap();
}

// 创建响应式对象
// 防止重复劫持
// 只读劫持
// 根据不同类型选择不同的劫持方式（collectionHandlers 或 baseHandlers）
function createReactiveObject (target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
  // 不是对象  直接返回
  if (!isObject(target)) {
    {
      console.warn(`value cannot be made reactive: ${String(target)}`);
    }
    return target;
  }
  // target is already a Proxy, return it.
  // 例外： exception: calling readonly() on a reactive object
  //  // 如果target已经代理了（__v_raw）, 返回target，除开 响应式对象的并且只读的情况
  if (target["__v_raw" /* RAW */] &&
    !(isReadonly && target["__v_isReactive" /* IS_REACTIVE */])) {
    return target;
  }
  // target already has corresponding Proxy
  // 有相应的代理  proxyMap-->  const reactiveMap = new WeakMap(); 
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  // only a whitelist of value types can be observed.
  // 如果  不能对象不能被扩展 或者 __v_skip属性 直接返回
  const targetType = getTargetType(target);
  // 1 Object  Array
  // 2 Map Set WeakMap WeakSet
  // 0 其他
  if (targetType === 0 /* INVALID */) {
    return target;
  }


  // 重点...
  // collectionHandlers：对 Map Set的劫持, 
  // baseHandlers: 对进行 对象数组 的劫持

  const proxy = new Proxy(target, targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers);
  proxyMap.set(target, proxy);
  return proxy;
}

function getTargetType (value) {
  // 判断一个对象是否是可扩展的（是否可以在它上面添加新的属性）。
  return value["__v_skip" /* SKIP */] || !Object.isExtensible(value)
    ? 0 /* INVALID */
    : targetTypeMap(toRawType(value));
}

// 基本数据劫持
const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
};
const get = /*#__PURE__*/ createGetter();
//  浅 获取
const shallowGet = /*#__PURE__*/ createGetter(false, true);
// 只读
const readonlyGet = /*#__PURE__*/ createGetter(true);
// 浅只读
const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true);

//定义一个 数组 对象
const arrayInstrumentations = {};

// 把下面三个数组的方法 转换为响应式
['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
  // 获取对应的方法
  const method = Array.prototype[key];
  // 数组对象中  放入三个方法
  arrayInstrumentations[key] = function (...args) {
    // 返回 reactive 或 readonly 代理的原始对象
    const arr = toRaw(this);
    // function toRaw (observed) {
    //   return ((observed && toRaw(observed["__v_raw" /* RAW */])) || observed);
    // }
    for (let i = 0, l = this.length; i < l; i++) {
      //  收集 依赖 type 为get
      track(arr, "get" /* GET */, i + '');
    }
    // we run the method using the original args first (which may be reactive)
    // 调用 方法 实现原来的 功能
    const res = method.apply(arr, args);
    //  如果没找到，把参数 也转换为原始对象再 试一次   找到 的话，直接返回方法的结果
    if (res === -1 || res === false) {
      // if that didn't work, run it again using raw values.
      return method.apply(arr, args.map(toRaw));
    }
    else {
      return res;
    }
  };
});
// 转换为响应式 这些数组 会改变数组的 长度
['push', 'pop', 'shift', 'unshift', 'splice'].forEach(key => {
  const method = Array.prototype[key];
  //  有8个方法
  arrayInstrumentations[key] = function (...args) {
    //  停止 track
    pauseTracking();
    const res = method.apply(this, args);
    // 判断trackStack 是否被收集完 
    resetTracking();
    return res;
  };
});
/**** start ****/
let shouldTrack = true;
const trackStack = [];
function pauseTracking () {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function enableTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = true;
}

function resetTracking () {
  const last = trackStack.pop();
  shouldTrack = last === undefined ? true : last;
}
/**** end ****/


function createGetter (isReadonly = false, shallow = false) {
  return function get (target, key, receiver) {
    // 一些 __v_isReactive、__v_isReadonly、__v_raw的处理
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return !isReadonly;
    }
    else if (key === "__v_isReadonly" /* IS_READONLY */) {
      return isReadonly;
    }
    //  如果key __v_raw  获取代理的原始对象
    else if (key === "__v_raw" /* RAW */ &&
      receiver ===
      (isReadonly
        ? shallow
          ? shallowReadonlyMap
          : readonlyMap
        : shallow
          ? shallowReactiveMap
          : reactiveMap).get(target)) {
      return target;
    }

    // 数组操作
    const targetIsArray = isArray(target);
    //  不是只读  并且是数组   而且  在上面已经收集过
    if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver);
    }
    // 获取 代理后的值
    const res = Reflect.get(target, key, receiver);

    if (isSymbol(key)
      ? builtInSymbols.has(key)
      : isNonTrackableKeys(key)) {
      return res;
    }
    //  收集 get为key作为依赖
    if (!isReadonly) {
      track(target, "get" /* GET */, key);
    }
    //  浅层 直接返回
    if (shallow) {
      return res;
    }
    //  是ref
    if (isRef(res)) {
      // ref unwrapping - does not apply for Array + integer key.
      const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
      return shouldUnwrap ? res.value : res;
    }
    // 如果是对象呢。那么递归
    if (isObject(res)) {
      // Convert returned value into a proxy as well. we do the isObject check
      // here to avoid invalid value warning. Also need to lazy access readonly
      // and reactive here to avoid circular dependency.
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}

function readonly (target) {
  return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
}


const set = /*#__PURE__*/ createSetter();
const shallowSet = /*#__PURE__*/ createSetter(true);
function createSetter (shallow = false) {
  return function set (target, key, value, receiver) {
    //  获取 原来的值
    let oldValue = target[key];
    //  如果是不浅层的
    if (!shallow) {
      //  新老值  都先 尝试获取原始对象
      value = toRaw(value);
      oldValue = toRaw(oldValue);
      //  不是数组  老值是ref对象  新值不是ref对象 。把新值赋值到ref对象的value
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      }
    }
    // 判断 key是否存在
    const hadKey = isArray(target) && isIntegerKey(key) // 如果是数组  并且 key 是数字  
      ? Number(key) < target.length
      : hasOwn(target, key);
    //  代理后得到的值
    const result = Reflect.set(target, key, value, receiver);
    // don't trigger if target is something up in the prototype chain of original
    // 如果目标是原型链中的某个东西，就不要触发
    if (target === toRaw(receiver)) {
      // 添加
      if (!hadKey) {
        trigger(target, "add" /* ADD */, key, value);
      }
      //  重置
      else if (hasChanged(value, oldValue)) {
        trigger(target, "set" /* SET */, key, value, oldValue);
      }
    }
    return result;
  };
}



//   环境变量
let activeEffect;
//  收集依赖
function track (target, type, key) {
  if (!shouldTrack || activeEffect === undefined) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
    if (activeEffect.options.onTrack) {
      activeEffect.options.onTrack({
        effect: activeEffect,
        target,
        type,
        key
      });
    }
  }
}


function trigger (target, type, key, newValue, oldValue, oldTarget) {
  // 获取环境变量
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // never been tracked
    return;
  }
  const effects = new Set();
  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        if (effect !== activeEffect || effect.allowRecurse) {
          effects.add(effect);
        }
      });
    }
  };
  //  清理
  if (type === "clear" /* CLEAR */) {
    // collection being cleared
    // trigger all effects for target
    // 触发目标的所有效果
    depsMap.forEach(add);
  }
  else if (key === 'length' && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= newValue) {
        add(dep);
      }
    });
  }
  else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      add(depsMap.get(key));
    }
    // also run for iteration key on ADD | DELETE | Map.SET
    switch (type) {
      case "add" /* ADD */:
        if (!isArray(target)) {
          add(depsMap.get(ITERATE_KEY)); // const ITERATE_KEY = Symbol('iterate');
          if (isMap(target)) {
            add(depsMap.get(MAP_KEY_ITERATE_KEY)); // const MAP_KEY_ITERATE_KEY = Symbol('Map key iterate');
          }
        }
        else if (isIntegerKey(key)) {
          // new index added to array -> length changes
          add(depsMap.get('length'));
        }
        break;
      case "delete" /* DELETE */:
        if (!isArray(target)) {
          add(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            add(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        }
        break;
      case "set" /* SET */:
        // const isMap = (val) => toTypeString(val) === '[object Map]';
        if (isMap(target)) {
          add(depsMap.get(ITERATE_KEY));
        }
        break;
    }
  }
  const run = (effect) => {
    // 存在 onTrigger 方法 调用
    if (effect.options.onTrigger) {
      effect.options.onTrigger({
        effect,
        target,
        key,
        type,
        newValue,
        oldValue,
        oldTarget
      });
    }
    //  如果存在 scheduler调用
    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    }
    //  否则 调用 effect依赖
    else {
      effect();
    }
  };
  effects.forEach(run);
}










//  Object.freeze 可以冻结一个对象
function effect (fn, options = EMPTY_OBJ) {
  // const EMPTY_OBJ = Object.freeze({})
  if (isEffect(fn)) {
    fn = fn.raw;
  }
  // function isEffect (fn) {
  //   return fn && fn._isEffect === true;
  // }
  const effect = createReactiveEffect(fn, options);
  //  如果没有配置 lazy 上来就会执行 。 computed就不用上来就执行
  if (!options.lazy) {
    effect();
  }
  return effect;
}


let uid = 0;
const effectStack = [];
// 创建响应式 的effect 影响
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
      // effect.active 属性为false  并且没有  没有 options.scheduler 执行 函数
      //  trigger 里面会执行 scheduler
        if (!effect.active) {
            return options.scheduler ? undefined : fn();
        }
        if (!effectStack.includes(effect)) {
          //  清空 effect
            cleanup(effect);
            try {
              //  能track  shouldTrack  为true
                enableTracking();
                effectStack.push(effect);
                // 环境变量  activeEffect 修改为当前 effect 影响
                activeEffect = effect;
                //  调用 fn函数 fn中 有 已经被收集的依赖 ，此时会触发get获取的方法
                //  get中 又会触发 track 方法  ，然后收集到 targetMap 中 
                //  改变的时候 就会触发 targetMap
                return fn();
            }
            finally {
              // 结束
                effectStack.pop();
                resetTracking();
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    };
    effect.id = uid++;
    effect.allowRecurse = !!options.allowRecurse;
    effect._isEffect = true;
    effect.active = true;
    effect.raw = fn;
    effect.deps = [];
    effect.options = options;
    return effect;
}

function cleanup(effect) {
  const { deps } = effect;
  if (deps.length) {
      for (let i = 0; i < deps.length; i++) {
          deps[i].delete(effect);
      }
      deps.length = 0;
  }
}



const mutableCollectionHandlers = {
  get: createInstrumentationGetter(false, false)
};

function createInstrumentationGetter(isReadonly, shallow) {
  const instrumentations = shallow
      ? isReadonly
          ? shallowReadonlyInstrumentations
          : shallowInstrumentations
      : isReadonly
          ? readonlyInstrumentations
          : mutableInstrumentations;
  return (target, key, receiver) => {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
          return !isReadonly;
      }
      else if (key === "__v_isReadonly" /* IS_READONLY */) {
          return isReadonly;
      }
      else if (key === "__v_raw" /* RAW */) {
          return target;
      }
      return Reflect.get(hasOwn(instrumentations, key) && key in target
          ? instrumentations
          : target, key, receiver);
  };
}