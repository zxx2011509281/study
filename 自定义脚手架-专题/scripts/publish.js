let path = require('path');
let fs = require('fs-extra');
const { exec } = require('shelljs');
const program = require('commander');
let basicFTP = require('basic-ftp');
// let fprocess = require('child_process');
// const chalk = require('chalk');
const uploadCDN = require('./uploadCDN');
const { projectPath, root, workingPath } = require('./projectPath');

let templatesPath = path.resolve(root, 'templates/');
let packageJson = fs.readJSONSync(path.resolve(workingPath, 'package.json'));
templatesPath = `${templatesPath}/${packageJson.ztType}/special`;
// let ztName = fprocess.execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

program
  .version('0.1.0')
  .option('-t, --target <type>', '发布目标, 可选值：neibu')
  .parse(process.argv);

if (program.target !== 'neibu') {
  // if (ztName !== 'master') {
  //   console.log(`请注意，专题项目，合并到${chalk.bold.green('master')}${chalk.red('分支进行发布！当前分支为')}${chalk.bold.yellow(ztName)}`);
  //   process.exit(400);
  // }
  console.log('移动模板到 templates 目录');
  exec(`mkdir -p ${templatesPath}`);
  exec(`cp ${workingPath}/pro-dist/${packageJson.name}/*.html ${templatesPath}/`);


  console.log(`准备发布 ${projectPath} 的静态资源到: daxueui-oss.koocdn.com/zhuanti/\n\n`);
  (async function() {
    try {
      await uploadCDN({
        dir: `${workingPath}/pro-dist/${packageJson.name}`,
        token: 'eyJhbGciOiJIUzUxMiJ9.eyJidWNrZXQiOiJkYXh1ZXVpIiwic3ViIjoic2FyZGluZS1hY2Nlc3MtdG9rZW4iLCJhcHBOYW1lIjoiZGF4dWUtdWkiLCJpYXQiOjE2MDAyMjc3MjN9.o7AitpOz6E21hYCIBX6UQ3oPYAXi6dX7abZb-CKpaJ7egLd4p6B2BfnfzgyV2xUt6IbmA5egUUa2EVdj4-XU8w',
        prefix: `static/${projectPath}`,
        parallel: 2,
        isProduction: true,
      });
      console.log('静态资源上传成功');
    } catch (err) {
      console.error('静态资源上传失败', err);
    }
  })();
} else {
  console.log(`准备发布 ${projectPath} 的静态资源到测试 CDN: daxueui-osstest.koocdn.com/zhuanti/\n\n`);
  (async function() {
    try {
      await uploadCDN({
        dir: `${workingPath}/neibu-dist/${packageJson.name}`,
        token: 'eyJhbGciOiJIUzUxMiJ9.eyJidWNrZXQiOiJkYXh1ZXVpLXRlc3QiLCJzdWIiOiJzYXJkaW5lLWFjY2Vzcy10b2tlbiIsImFwcE5hbWUiOiJkYXh1ZS11aSIsImlhdCI6MTU5OTU1NDg1Mn0.RihXkc8MkPWt697fEUp4Mdbl7njFiWf9GDeeRNbd5Al8zivTimWimZt5ZGzdth41J_MnQV6zf9RMuPrtlaupmA',
        prefix: `static/${projectPath}`,
        parallel: 2,
      });
      console.log('静态资源上传成功');
    } catch (err) {
      console.error('静态资源上传失败', err);
    }

    console.log(`开始上传 ${projectPath} 目录的内部专题模版！如有修改请在cms后台更新！～`);
    let type = packageJson.ztType;
    let htmlLists = getHtmlLists(projectPath);
    let { length } = htmlLists;
    if (length === 0) {
      console.log('该专题没有要上传的模板，请将要上传的模板放在专题的根目录下！');
      return true;
    }
    let FTPPath = `manage/phpcms/templates/${type}/special`;
    let client = new basicFTP.Client();
    // client.ftp.verbose = true;
    await client.access({
      host: '10.155.10.72',
      port: 21,
      user: 'yinkun',
      password: 'yinkun',
    });
    console.log('建立neibu-ftp链接：');
    await client.cd(FTPPath);
    for (let i = 0; i < length; i++) {
      let item = htmlLists[i];
      console.log(item.pathname, item.name, 1000000000000000);
      // eslint-disable-next-line no-await-in-loop
      await client.uploadFrom(item.pathname, item.name);
      console.log(`${item.name} 上传至 ${type}类目下`);
    }
    console.log('内部专题模板上传完毕');
    client.close();
    return true;
  })();
}

// 通用的列表读取函数
function getSpecificTypFiles(dir, rtype) {
  let lists;
  try {
    lists = fs.readdirSync(dir);
  } catch (e) {
    console.log(`不存在此目录: ${dir}`);
    process.exit(1);
  }
  lists = lists.filter(function(name) {
    // 重置搜索起始位置
    rtype.lastIndex = 0;
    return rtype.test(name);
  });
  lists = lists.map(function(name) {
    return {
      pathname: path.normalize(`${dir}/${name}`).replace(/\\/gi, '/'),
      name,
    };
  });
  return lists;
}

// 获取待上传的文件列表
function getHtmlLists() {
  const distProjectPath = program.target == 'neibu' ? 'neibu-dist' : 'pro-dist';
  return getSpecificTypFiles(`${workingPath}/${distProjectPath}/${packageJson.name}/`, /\.html$/);
}
