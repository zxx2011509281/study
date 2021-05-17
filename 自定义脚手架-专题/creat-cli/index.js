#!/usr/bin/env node
/// *********************************
/// 警告：
/// 请不要修改此文件
/// by:luoxiongze
/// *********************************
const fs = require('fs-extra');

// const fs = require('fs');
// const download = require('download-git-repo');
const inquirer = require('inquirer');
const handlebars = require('handlebars');
const ora = require('ora');
const chalk = require('chalk');
const symbols = require('log-symbols');
const { spawn } = require('child_process');
const path = require('path');

const now = new Date();

inquirer.prompt([
  {
    type: 'input',
    name: 'year',
    message: '请输入项目年份，比如2019(插件请输入"plugins")',
    default: now.getFullYear(),
  }, {
    type: 'input',
    name: 'name',
    message: '请输入项目名称，比如0702projectname(注意不要使用过长的文件名，CMS会报错)',
    default: `${String(now.getMonth() + 1).padStart(2, '00')}${now.getDate()}-projectName`,
  }, {
    type: 'list',
    name: 'platform',
    message: 'PC端项目还是wap端项目？',
    choices: ['pc', 'wap'],
    default: 0,
  }, {
    type: 'input',
    name: 'author',
    message: '请输入作者名称',
    default: 'author_name',
  }, /* {
        type: 'input',
        name: 'outputFolder',
        message: '请输入输出的目录:',
        default: 'pro-dist'
    }, */{
    type: 'input',
    name: 'ztType',
    message: '请输入专题类型(kaoyan):',
    default: 'kaoyan',
  }, {
    type: 'confirm',
    name: 'autoInitialize',
    message: '是否自动安装依赖？',
  }, {
    type: 'list',
    name: 'packageManager',
    message: '使用哪种包管理工具？',
    choices: ['npm', 'yarn'],
    default: 0,
  },
]).then((answers) => {
  const { year, name } = answers;
  const projectBasePath = year == 'plugins' ? 'project/plugins' : `project/zt/${year}/${name}`;

  // 暂时写死outputFolder和ztType的值
  answers.outputFolder = 'pro-dist';
  // answers.ztType = 'kaoyan';

  // 项目已存在则退出
  if (fs.existsSync(projectBasePath)) {
    return console.log(symbols.error, chalk.red('项目已存在'));
  }

  downloadTemplate(projectBasePath, answers);
  return true;
});

function downloadTemplate(projectBasePath, answers) {
  let templatePath = path.join(__dirname, '..', 'template', 'base');
  fs.copySync(templatePath, projectBasePath);
  if (answers.platform === 'wap') {
    handlePlatform(projectBasePath);
  }

  updatePackageJson(answers, projectBasePath);

  console.log(symbols.success, chalk.green('项目初始化成功'));

  answers.autoInitialize && yarnInstall(projectBasePath, answers.packageManager);
}

// 处理pc 和 wap的差异
function handlePlatform(projectBasePath) {
  // html模板引用文件
  const indexHtmlFileName = `${projectBasePath}/src/index.ejs`;
  const htmlFile = fs.readFileSync(indexHtmlFileName)
    .toString()
    .replace('./ejstpls/public-pc.ejs', './ejstpls/public-wap.ejs');

  fs.writeFileSync(indexHtmlFileName, htmlFile);
}

// 合并选项到package.json
function updatePackageJson(answers, projectBasePath) {
  const meta = { ...answers };
  console.log(symbols.success, chalk.green(`你的配置是：\n${JSON.stringify(meta)}`));
  const fileName = `${projectBasePath}/package.json`;
  const content = fs.readFileSync(fileName).toString();
  const result = handlebars.compile(content)(meta);

  fs.writeFileSync(fileName, result);
}

// 安装依赖
function yarnInstall(dir, pm) {
  const spinner = ora('正在安装依赖……').start();
  const sp = spawn(pm, ['install'], {
    cwd: path.resolve(__dirname, `../${dir}`),
    shell: /^win/.test(process.platform),
  });

  sp.on('message', (msg) => {
    console.log(msg.toString());
  });
  sp.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  sp.on('close', (code) => {
    if (code !== 0) {
      spinner.fail();
      return console.log(chalk.red(`安装失败，退出码 ${code}`));
    }
    spinner.succeed();
    console.log(chalk.green(`下载依赖成功~请执行cd ${dir}`));
    return true;
  });
}
