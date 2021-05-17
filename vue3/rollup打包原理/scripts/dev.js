const execa = require('execa')// 开启子进程 打包， 最终还是rollup来打包的

// 获取 yarn dev --target=xxx 比如 yarn dev --target=reactivity 可以 执行 reactivity打包
const args = require('minimist')(process.argv.slice(2))
const target = args.target

build(target)
/**
 * 对目标进行依次打包，并且是并行打包
 * */
// 打包
async function build(target) {
  // 第一参数 是命令
  // 第二个参数 是rollup 运行时的执行的参数  
  //          -c 采用配置文件 
  //          --environment 设置环境变量 
  //          `TARGET:${target}` 环境变量 里面设置的对象。在rollup 配置文件执行时，可以获取到
  //          SOURCE_MAP 是否生成 sourceMap文件
  // 第三个参数 execa 执行的参数  stdio: 'inherit' 子进程打包的信息 共享给父进程
  await execa('rollup', ['-cw', '--environment', [`TARGET:${target}`, `SOURCE_MAP:ture`].join(',')], { stdio: 'inherit' })
}