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

      ctx.type = 'application/javascript'
      ctx.body += `
          ${rewriteImport(descriptor.script.content.replace('export default ', 'const __script = '))}
          
        `

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

