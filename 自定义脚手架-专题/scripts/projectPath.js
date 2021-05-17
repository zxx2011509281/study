let path = require('path');

let workingPath = process.cwd();
let root = path.resolve(__dirname, '..');
let projectPath = workingPath.replace(`${root}${path.sep}`, '');
projectPath = projectPath.replace(/\\/g, '/')


module.exports = {
  workingPath,
  root,
  projectPath,
};

