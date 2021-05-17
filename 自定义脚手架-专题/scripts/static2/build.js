#!/usr/bin/env node
/**
 * yarn add shelljs commander -D
 * chmod 777 ${this file}
 */
/* global echo exec */

require('shelljs/global');
const program = require('commander');
const { exec } = require('shelljs');
const { projectPath, root } = require('../projectPath');

process.chdir(root);
program
  .version('0.1.0')
  .option('-e, --env <type>', '部署环境, 可选值：development，production')
  .option('-a, --analyz', '查看打包结果分析')
  .parse(process.argv);

process.env.NODE_BUILD_PATH = projectPath || 0;
process.env.NODE_ENV = program.env || 'production';
process.env.ANALYZ = program.analyz ? 1 : 0;

if (process.env.NODE_BUILD_PATH === '0') {
  echo('path 参数缺失');
  return;
}

if (program.env === 'development') {
  exec('yarn _dev');
} else {
  exec('yarn _build');
}
