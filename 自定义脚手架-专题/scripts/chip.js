let path = require('path');
let fs = require('fs-extra');
const request = require('request');
const program = require('commander');
let querystring = require('querystring');

const { workingPath } = require('./projectPath');

let packageJson = fs.readJSONSync(path.resolve(workingPath, 'package.json'));

const env = process.env.NODE_ENV;

const isNeibu = env === 'neibu' ? 'neibu.': '';

program
  .version('0.1.0')
  .option('-t, --target <type>', '执行的行为, get/post')
  .parse(process.argv);

let successCode = 5008;

let files = getChipList();
if (files.length == 0) {
  console.log('<span class="err">该专题没有要更新的模板。</span>');
  process.exit(1);
}

if (program.target === 'get') {
  getChip();
} else if (program.target === 'post') {
  publishChip();
} else {
  console.error('先选择执行的行为! get or publish');
}
function getChip() {
  (async function() {
    for (let i = 0; i < files.length; i++) {
      let item = files[i];
      let chipName = `/project/zt/${packageJson.year}/${packageJson.name}/chip/${item.filename}`;
      chipName = chipName.replace('.ejs', '.html');
      let query = querystring.stringify({ name: chipName });
      let url = `http://apiproduct.koolearn.com/special/getid?${query}`;
      // console.log(item, url);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
          let result = JSON.parse(body);
          if (res.statusCode == 200 && result.state == successCode) {
            console.log(`正在更新碎片: ${result.data.name}`);
            let { data = {} } = result.data;
            fs.writeFileSync(item.pathname, data);
            resolve();
          } else {
            console.error('查询失败！', item);

            reject();
          }
          return false;
        });
      });
    }
  })();
}
function publishChip() {
  (async function() {
    for (let i = 0; i < files.length; i++) {
      let item = files[i];
      item.name = `/project/zt/${packageJson.year}/${packageJson.name}/chip/${item.filename.replace('.ejs', '.html')}`;
      console.log('post', item);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve, reject) => {
        request.post(`http://apiproduct.${isNeibu}koolearn.com/special`, {
          form: item,
        }, (err, res, body) => {
          let result = JSON.parse(body);
          if (res.statusCode == 200 && result.state == successCode) {
            console.log(`${item.name}: 上传成功, 碎片id: ${result.data && result.data.id}`);
            resolve();
          } else {
            console.log(`${item.name}: 上传失败`);
            reject();
          }
        });
      });
    }
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
    let pathname = path.normalize(`${dir}/${name}`).replace(/\\/gi, '/');
    let data = fs.readFileSync(pathname, { encoding: 'utf-8' });
    return {
      pathname,
      name: path.normalize(`/${dir}/${name}`).replace(/\\/gi, '/').replace(/\/\//gi, '/'),
      filename: name,
      data,
    };
  });
  return lists;
}

// 获取待上传的文件列表
function getChipList() {
  return getSpecificTypFiles('src/chip', /\.ejs$/);
}
