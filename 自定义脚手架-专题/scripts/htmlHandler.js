import fs from 'fs';
import path from 'path';
import HTMLProcessor from 'htmlprocessor/lib/htmlprocessor';
import { root, projectPath } from './config/PATH';

// let entryReg = /seajs\.use\(.?(?:'|")(.+)(?:'|").*,/m;
let entryReg = /<!--\s*js:entry\s?([^\s]+)\s*-->/m;
export function getEntries() {
  let filePath = projectPath.indexOf(':') != -1 ? projectPath : path.join(root + path.sep + projectPath);
  let entryObj = {};
  let fileList;
  try {
    fileList = fs.readdirSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(filePath, '不是一个正确的项目路径');
      process.exit(1);
    }
    throw (err);
  }
  let htmlMap = {};
  fileList.forEach((file) => {
    if (!file.endsWith('.html')) return;
    let htmlPath = path.resolve(filePath, file);
    let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    let ret = entryReg.exec(htmlContent);
    if (ret) {
      htmlMap[file] = {
        content: htmlContent,
        path: htmlPath,
      };
      let entry = ret[1];
      let entryKey = entry.replace(`${projectPath}/`, '');
      entryObj[entryKey] = `./${entry}.es6`;
    }
  });
  return { entryObj, htmlMap };
}

export function templateContent(filename) {
  let htmlProcessor = new HTMLProcessor({
    includeBase: path.resolve(root, 'project'),
    customBlockTypes: [path.resolve(__dirname, './zt-tip-tpl.js')],
    recursive: true,
  });
  let ret = htmlProcessor.process(path.resolve(projectPath, filename));
  return (webpackConfig) => {
    return ret.replace(entryReg, function(_, $1) {
      console.log('jsEntry', $1, webpackConfig.htmlWebpackPlugin.files.js);
      let entryJs = webpackConfig.htmlWebpackPlugin.files.js.filter(function(js) {
        return js.indexOf($1.replace(`${projectPath}`, '')) !== -1;
      })[0];
      if (entryJs) {
        return `<script src="${entryJs}"></script>\n<!--zhuanti:${projectPath}-->\n`;
      }
      console.warn('没有找到js:entry');
      return '';
    });
  };
}
