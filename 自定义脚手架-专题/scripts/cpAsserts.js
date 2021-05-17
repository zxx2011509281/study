let path = require('path');
let fs = require('fs-extra');
const { exec } = require('shelljs');

console.log('mv asserts');

let workingProject = process.cwd();
let root = path.resolve(__dirname, '..');
let assertsPath = path.resolve(root, 'dist/');
let projectPath = workingProject.replace(root, '');
let packageJson = fs.readJSONSync(path.resolve(workingProject, 'package.json'));
assertsPath = `${assertsPath}/${projectPath}`;
exec(`mkdir -p ${assertsPath}`);
exec(`cp -r ${workingProject}/pro-dist/${packageJson.name}/ ${assertsPath}/`);


