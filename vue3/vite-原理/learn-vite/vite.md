### vue3 最大的优点： 编译时的优化
vite 是一个基于 Vue3 单文件组件的非打包开发服务器，它做到了本地快速开发启动：

1. 快速的冷启动，不需要等待打包操作；
2. 即时的热模块更新，替换性能和模块数量的解耦让更新飞起；
3. 真正的按需编译，不再等待整个应用编译完成，这是一个巨大的改变。

由于现代浏览器都支持es6的import;
import XX from './a.js' 时 浏览器会发出一个网络请求
vite会拦截这个请求，去做vue相关的编译、解析等，这样就实现了按需加载的能力
快的原因 是不用 打包

### vite有啥用
1. vue3配套的工具， 下一代脚手架工具
2. 掌握vue3 代码编译的流程(使用层面)

### 原理：
在html中 script链接上要增加type="module"
```
<script type="module" src="/src/main.js"></script>
```

然后对比 main.js
代码
```
import { createApp } from 'vue'
import App from './App.vue'
import './index.css'

createApp(App).mount('#app')

```
然后查看浏览器 看返回 main.js
```
import { createApp } from '/@modules/vue.js'
import App from '/src/App.vue'
import '/src/index.css?import'

createApp(App).mount('#app')
```

1. 将vue引用转化为/@modules/vue.js
2. 将./App.vue转换为/src/App.vue
3. 将./index.css转化为/src/index.css?import

`/@modules/vue.js`会新发起一个网络请求 `http://localhost:3000/@modules/vue.js`
![image.png](https://upload-images.jianshu.io/upload_images/4642829-ceb61b645d8cf9f1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

直接返回内容；

###实现vite效果
创建一个server.js
```
const fs = require('fs')
const path = require('path')
const Koa = require('koa')

const app = new Koa()

app.use(ctx => {
  const { request: { url, query } } = ctx
  // 访问根目录 渲染index.html
  if (url === '/') {
    // 读取文件
    let content = fs.readFileSync('./index.html', 'utf-8')
    ctx.type = "text/html"
    ctx.body = content
  }
})

app.listen(9092, () => {
  console.log('listen 9092');
})
```
然后把html中 alert试一下，启动服务器
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vite App</title>
</head>
<body>
  <div id="app"></div>
  <!-- <script type="module" src="/src/main.js"></script> -->
  <script>
    alert(2)
  </script>
</body>
</html>

```
`nodemon server.js` , 打开http://localhost:9092/
页面弹出了alert, 怎么启动成功

下面我们把 alert(2)去掉，把注释的main.js放开，可以看到页面报错了
![image.png](https://upload-images.jianshu.io/upload_images/4642829-536b9d3535d4ce9e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

处理一下 server.js 中处理 js文件
```
const fs = require('fs')
const path = require('path')
const Koa = require('koa')

const app = new Koa()

app.use(ctx => {
  const { request: { url, query } } = ctx
  // 访问根目录 渲染index.html
  if (url === '/') {
    // 读取文件
    let content = fs.readFileSync('./index.html', 'utf-8')
    ctx.type = "text/html"
    ctx.body = content


  }
  // 处理js 文件 
  else if (url.endsWith('.js')) {
    // 把 / 干掉
    const _path = path.resolve(__dirname, url.slice(1))
    ctx.type = "application/javascript"
    const content = fs.readFileSync(_path, 'utf-8')
    ctx.body = content
  }
})

app.listen(9092, () => {
  console.log('listen 9092');
})
```
![image.png](https://upload-images.jianshu.io/upload_images/4642829-cdba085bf38a88a1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

现在main.js 已经处理过来了，但是页面有报错提示， 用import时 来源必须用 "/". "./", "../"。
而在 main.js中引入 `import { createApp } from 'vue'`没有用这种方式。
### 目前我们还要处理几种情况
1.  支持 npm包的import
2.  支持.vue当文件组件的解析
3.  支持import css

#### 处理npm 包 的import
这里我们就规定 ： `不是以 / ./ ../ 开头的，那么就来着 node_modules`
首先我们把main.js中的 
import { createApp } from 'vue'   中vue 替换为 '/@modules/vue.js'
我们再server.js中增加一个函数 处理 
```
//  目的是把 不是 / ./ ../开头的import 改造成 /@modules/开头
function rewriteImport(content){
  return content.replace(/ from ['|"]([^'"]+)['|"]/g , function(s0,s1){
    console.log('rewriteImport', s0, s1);
    if(s1[0] !== '.' && s1[0] !== '/'){
      return ` from '/@modules/${s1}'`
    } else {
      return s0
    }
  })
}
```
然后再处理 js文件时  把content内容调用函数处理
```
  else if (url.endsWith('.js')) {
    // 把 / 干掉
    const _path = path.resolve(__dirname, url.slice(1))
    ctx.type = "application/javascript"
    const content = fs.readFileSync(_path, 'utf-8')
    ctx.body = rewriteImport(content)
  }
```
再看一下浏览器控制台
![image.png](https://upload-images.jianshu.io/upload_images/4642829-dc115f05ea55d423.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

说明我们处理成功了，但是发起请求 时404. 
此时， koa监听得到 /@modules开头的网络请求时，我们就去node_modules里面去查找

这里要明白 在 node_modules里面我们要找的是什么。 比如
![image.png](https://upload-images.jianshu.io/upload_images/4642829-7a3f882c7dc3366d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
这里我们就是去 找的 对应文件下的package.json中 module对应的路径(main 对应的是 require的， module对应的es6 import)

好了，我们继续再server.js中增加判断
```
  // 处理 /@modules/开头 
  // 这个模板 不是本地文件，而是 node_modules中
  else if (url.startsWith('/@modules/')) {
    // 拿到文件 路径的前缀
    const prefix = path.resolve(__dirname, 'node_modules', url.replace('/@modules/', ''))

    // 拿到 文件下 package.json中 module 对应的路径
    const module = require(prefix + '/package.json').module

    // 获取完整路径
    const p = path.resolve(prefix, module)

    const ret = fs.readFileSync(p, 'utf-8')

    ctx.type = 'application/x-javascript'

    ctx.body = rewriteImport(ret)
  }
```
![image.png](https://upload-images.jianshu.io/upload_images/4642829-d08052e68fe5ac40.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
(main.js中 先只引入 import { createApp } from 'vue')

此时我们可以拿到vue，并且通过vue拿到vue依赖的其他文件。但是现在有个问题 浏览器中是没有process存在的。
我们简单粗暴的 在server.js中处理一下, 在window对象上挂载一个process 变量, 在url === '/' 中增加一个script
```
 if (url === '/') {
    // 读取文件
    let content = fs.readFileSync('./index.html', 'utf-8')

    content = content.replace('<script', `
      <script>
        window.process = {
          env: {
            NODE_ENV: 'dev'
          }
        }
      </script>
      <script
    `)
    
    ctx.type = "text/html"
    ctx.body = content
  }
```
然后再来页面看一下
![image.png](https://upload-images.jianshu.io/upload_images/4642829-a14d87c35771f677.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### .vue当文件组件的解析
由于.vue文件 浏览器是不认识的，浏览器再import中只认识js
1. 我们把 .vue文件 拆开为 script ,template (由于app.vue中没有css，这里不处理)
2. template 转换为 render函数  拼成一个对象
3. script.render = render
看一下vite处理的app.vue
![image.png](https://upload-images.jianshu.io/upload_images/4642829-ec253200c264b934.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
app.vue
```
<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Hello Vue 3.0 + Vite" />
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    HelloWorld
  }
}
</script>
```

解析单文件 单文件组件， 需要官方的库 npm i @vue/complie-sfc -D
然后再server.js中引入
```
const complierSfc = require('@vue/compiler-sfc')
```
然后我们处理.vue文件
```
  // 处理 .vue文件
  else if (url.indexOf('.vue') > -1) {
    // import  xx from 'xx.vue'
    // 处理类似 可能有 "/src/App.vue?type=template"
    const p = path.resolve(__dirname, url.split('?')[0].slice(1))

    // 解析单文件组件， 需要官方的库 npm i @vue/complie-sfc -D
    const { descriptor } = complierSfc.parse(fs.readFileSync(p, 'utf-8'))
    console.log('descriptor', descriptor);
  }

```
我们可以看到 descriptor 返回有模板信息
![image.png](https://upload-images.jianshu.io/upload_images/4642829-aa2168480ad364d4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
以及 script 信息
![image.png](https://upload-images.jianshu.io/upload_images/4642829-f19e1439df575eba.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

现在我们处理 js
```
else if (url.indexOf('.vue') > -1) {
    // import  xx from 'xx.vue'
    // 处理类似 "/src/App.vue?type=template"
    const p = path.resolve(__dirname, url.split('?')[0].slice(1))

    // 解析单文件组件， 需要官方的库 npm i @vue/complie-sfc -D
    const { descriptor } = complierSfc.parse(fs.readFileSync(p, 'utf-8'))
    // js内容
    if(!query.type){
      ctx.type = 'application/x-javascript'
      ctx.body = `
        ${rewriteImport(descriptor.script.content.replace('export default ', 'const __script = '))}
        import {render as __render} from "${url}?type=template"
        __script.render = __render
        export default __script
      `
    }
  }
```
![image.png](https://upload-images.jianshu.io/upload_images/4642829-9c45b968e9109819.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

单文件的js处理好了。接下来处理 template
处理 template我们需要 npm i  @vue/compiler-dom -D
```
const complierDom = require('@vue/compiler-dom')
```
然后再处理vue单文件时增加 对template的处理
```
else if (url.indexOf('.vue') > -1) {
    // import  xx from 'xx.vue'
    // 处理类似 "/src/App.vue?type=template"
    const p = path.resolve(__dirname, url.split('?')[0].slice(1))

    // 解析单文件组件， 需要官方的库 npm i @vue/complie-sfc -D
    const { descriptor } = complierSfc.parse(fs.readFileSync(p, 'utf-8'))
    // js内容
    if(!query.type){
      ctx.type = 'application/x-javascript'
      ctx.body = `
        ${rewriteImport(descriptor.script.content.replace('export default ', 'const __script = '))}
        import {render as __render} from "${url}?type=template"
        __script.render = __render
        export default __script
      `
    } else if(query.type === 'template'){
      // 解析我的template 变成 render 函数
      const template = descriptor.template
      const render = complierDom.compile(template.content, {mode: 'module'}).code
      ctx.type = 'application/x-javascript'

      ctx.body = rewriteImport(render)
    }
  }

```

![image.png](https://upload-images.jianshu.io/upload_images/4642829-36ce87a74fa9e508.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

现在 对应vue文件的 template也可以处理了。其中图片没有显示出来，这里简单处理
app.vue文件中 图片的引入改为绝对引用
```
<template>
  <img alt="Vue logo" src="/src/assets/logo.png" />
  <HelloWorld msg="Hello Vue 3.0 + Vite" />
</template>
```
```
 else if(url.endsWith('.png')){

    const _path = path.resolve(__dirname, url.slice(1))

    const file = fs.readFileSync(_path)
    ctx.type = "image/png"
    ctx.body = file
  }
```
![image.png](https://upload-images.jianshu.io/upload_images/4642829-7a7fbc3508b7c0d0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


#### 支持import css

```
//  这里还可以支持 .scss .less .stylus .ts等 
  else if(url.endsWith('.css')){
    const  p = path.resolve(__dirname, url.slice(1))

    const file = fs.readFileSync(p, 'utf-8')

    // 处理换行
    const content = `
      const css = "${file.replace(/\n/g, '')}"
      const link = document.createElement('style')
      link.setAttribute('type', 'text/css')
      document.head.appendChild(link)
      link.innerHTML = css
      export default css
    `

    ctx.type = 'application/javascript'
    ctx.body = content
  }
```
![image.png](https://upload-images.jianshu.io/upload_images/4642829-4371ec9b19572b04.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### 处理.vue 文件中的style 
```
// 处理 .vue文件
  else if (url.indexOf('.vue') > -1) {
    // import  xx from 'xx.vue'
    // 处理类似 "/src/App.vue?type=template"
    const p = path.resolve(__dirname, url.split('?')[0].slice(1))

    // 解析单文件组件， 需要官方的库 npm i @vue/complie-sfc -D
    const { descriptor } = complierSfc.parse(fs.readFileSync(p, 'utf-8'))
    // js内容
    if (!query.type) {
      // 有js
      if (descriptor.script) {
        ctx.type = 'application/javascript'
        ctx.body += `
          ${rewriteImport(descriptor.script.content.replace('export default ', 'const __script = '))}
          
        `
      }
      // 有style
      if (descriptor.styles) {
        descriptor.styles.forEach((s, i) => {
          const styleRequest = url + `?type=style&index=${i}`;
          ctx.body += `\nimport ${JSON.stringify(styleRequest)}`;
        })
      }
      // 有模板
      if (descriptor.template) {
        const templateRequest = url + `?type=template`;
        ctx.body += `\nimport { render as __render } from ${JSON.stringify(templateRequest)}`;
        ctx.body += `\n__script.render = __render`;
      }

      ctx.body += `
      export default __script
      `
    }
```

然后我们把 vue?type=style 处理一下
```
    //  处理 .vue文件 type 为 style
    else if (query.type === 'style') {
      const index = Number(query.index);
      const styleBlock = descriptor.styles[index];

      const content = `
      var style = document.createElement('style'); 
      style.type = 'text/css'; 
      style.innerHTML= ${JSON.stringify(styleBlock.content.replace(/\n/g, ''))}; 
      document.head.appendChild(style)
    `

      ctx.type = 'application/javascript'
      ctx.body = content
    }
  } 

```

完整的server.js
```
const fs = require('fs')
const path = require('path')
const Koa = require('koa')
const complierSfc = require('@vue/compiler-sfc')
const complierDom = require('@vue/compiler-dom')

const app = new Koa()

//  目的是把 不是 / ./ ../开头的import 改造成 /@modules/开头
function rewriteImport (content) {
  return content.replace(/ from ['|"]([^'"]+)['|"]/g, function (s0, s1) {

    if (s1[0] !== '.' && s1[0] !== '/') {
      return ` from '/@modules/${s1}'`
    } else {
      return s0
    }
  })
}


// 处理 img 中 的路径
function replaceSrc (fileContent) {
  // <img alt="Vue logo" src="./assets/logo.png" />
  fileContent = fileContent.replace(/<img(.*)src=['|"](.+)['|"]/, function (s0, s1, s2) {

    if (s1[0] !== '.') {
      return `<img${s1}src='${path.resolve('./src/', s2)}'`.replace(__dirname, '')
    } else {
      return s0
    }
  })

  return fileContent;
}


app.use(ctx => {
  const { request: { url, query } } = ctx
  // 访问根目录 渲染index.html
  if (url === '/') {
    // 读取文件
    let content = fs.readFileSync('./index.html', 'utf-8')

    content = content.replace('<script', `
      <script>
        window.process = {
          env: {
            NODE_ENV: 'dev'
          }
        }
      </script>
      <script
    `)

    ctx.type = "text/html"
    ctx.body = content
  }
  //  简单粗暴 处理js 文件 
  else if (url.endsWith('.js')) {
    // 把 / 干掉
    const _path = path.resolve(__dirname, url.slice(1))
    ctx.type = "application/javascript"
    const content = fs.readFileSync(_path, 'utf-8')
    ctx.body = rewriteImport(content)
  }
  // 处理 /@modules/开头 
  // 这个模板 不是本地文件，而是 node_modules中
  else if (url.startsWith('/@modules/')) {
    // 拿到文件 路径的前缀
    const prefix = path.resolve(__dirname, 'node_modules', url.replace('/@modules/', ''))

    // 拿到 文件下 package.json中 module 对应的路径
    const module = require(prefix + '/package.json').module

    // 获取完整路径
    const p = path.resolve(prefix, module)

    const ret = fs.readFileSync(p, 'utf-8')

    ctx.type = 'application/javascript'

    ctx.body = rewriteImport(ret)
  }

  // 处理 .vue文件
  else if (url.indexOf('.vue') > -1) {
    // import  xx from 'xx.vue'
    // 处理类似 "/src/App.vue?type=template"
    const p = path.resolve(__dirname, url.split('?')[0].slice(1))

    // 解析单文件组件， 需要官方的库 npm i @vue/complie-sfc -D
    const { descriptor } = complierSfc.parse(fs.readFileSync(p, 'utf-8'))
    // js内容
    if (!query.type) {
      // 有js
      if (descriptor.script) {
        ctx.type = 'application/javascript'
        ctx.body += `
          ${rewriteImport(descriptor.script.content.replace('export default ', 'const __script = '))}
          
        `
      }
      // 有style
      if (descriptor.styles) {
        descriptor.styles.forEach((s, i) => {
          const styleRequest = url + `?type=style&index=${i}`;
          ctx.body += `\nimport ${JSON.stringify(styleRequest)}`;
        })
      }
      // 有模板
      if (descriptor.template) {
        const templateRequest = url + `?type=template`;
        ctx.body += `\nimport { render as __render } from ${JSON.stringify(templateRequest)}`;
        ctx.body += `\n__script.render = __render`;
      }

      ctx.body += `
      export default __script
      `
    }
    // 处理 .vue文件 type 为 template 
    else if (query.type === 'template') {
      // 解析我的template 变成 render 函数
      const template = descriptor.template
      const render = complierDom.compile(replaceSrc(template.content), { mode: 'module' }).code

      ctx.type = 'application/javascript'

      ctx.body = rewriteImport(render)
    } 
    //  处理 .vue文件 type 为 style
    else if (query.type === 'style') {
      const index = Number(query.index);
      const styleBlock = descriptor.styles[index];

      const content = `
      var style = document.createElement('style'); 
      style.type = 'text/css'; 
      style.innerHTML= ${JSON.stringify(styleBlock.content.replace(/\n/g, ''))}; 
      document.head.appendChild(style)
    `

      ctx.type = 'application/javascript'
      ctx.body = content
    }
  } 
  //  处理 png 图片
  else if (url.endsWith('.png')) {

    const _path = path.resolve(__dirname, url.slice(1))

    const file = fs.readFileSync(_path)
    ctx.type = "image/png"

    ctx.body = file
  }
  //  这里还可以支持 .scss .less .stylus .ts等 
  else if (url.endsWith('.css')) {
    const p = path.resolve(__dirname, url.slice(1))

    const file = fs.readFileSync(p, 'utf-8')

    // 处理换行
    const content = `
      const css = "${file.replace(/\n/g, '')}"
      const link = document.createElement('style')
      link.setAttribute('type', 'text/css')
      document.head.appendChild(link)
      link.innerHTML = css
      export default css
    `

    ctx.type = 'application/javascript'
    ctx.body = content
  }
})

app.listen(9092, () => {
  console.log('listen 9092');
})



```










