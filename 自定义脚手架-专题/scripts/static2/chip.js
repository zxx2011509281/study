let fs = require('fs');
let path = require('path');
let request = require('request');
let querystring = require('querystring');
const { echo } = require('shelljs');

const program = require('commander');

program
  .version('0.1.0')
  .option('-p, --path <type>', '打包指定路径')
  .option('-t, --type <type>', '上传/下载')
  .parse(process.argv);
process.env.NODE_BUILD_PATH = program.path || 0;
process.env.NODE_ENV = program.env || 'production';
process.env.environment = program.target;
let projectPath = process.env.NODE_BUILD_PATH;

if (process.env.NODE_BUILD_PATH === '0') {
  echo('path 参数缺失');
}

let successCode = 5008;

let files = getHtmlLists();
if (files.length == 0) {
  console.log('该专题没有要更新的模板。');
  return;
}
if (program.type === 'post') {
  console.log('开始上传碎片：');
  (async function() {
    for (let i = 0; i < files.length; i++) {
    // eslint-disable-next-line no-await-in-loop
      await updateChip(files[i]);
    }
  })();
} else if (program.type === 'get') {
  (async function() {
    for (let i = 0; i < files.length; i++) {
    // eslint-disable-next-line no-await-in-loop
      await getChip(files[i]);
    }
  })();
}
function updateChip(item) {
  return new Promise(function(resolve, reject) {
    // return resolve();
    request.post('http://apiproduct.koolearn.com/special', {
      form: item,
    }, function(err, res, body) {
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
function getChip(item, done) {
  let { name } = item;
  let url = getGetDataUrl(name);
  request(url, function(err, res, body) {
    let result = JSON.parse(body);

    if (res.statusCode == 200 && result.state == successCode) {
      console.log(`正在更新碎片: ${result.data.name}`);
      let { data } = result.data;
      fs.writeFileSync(name.slice(1), data);
    } else {
      console.log('查询失败！');
    }
    done(null);
  });
}

function getGetDataUrl(name) {
  let data = {
    name,
  };
  data = querystring.stringify(data);
  let url = `http://apiproduct.koolearn.com/special/getid?${data}`;
  return url;
}
// 通用的列表读取函数
function getSpecificTypFiles(dir, rtype) {
  let lists;
  try {
    lists = fs.readdirSync(`${dir}`);
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
    let pathname = path.normalize(`${process.cwd()}/${dir}/${name}`).replace(/\\/gi, '/');
    let data = fs.readFileSync(pathname, { encoding: 'utf-8' });
    return {
      name: path.normalize(`/${dir}/${name}`).replace(/\\/gi, '/').replace(/\/\//gi, '/'),
      data,
    };
  });
  return lists;
}

// 获取待上传的文件列表
function getHtmlLists() {
  return getSpecificTypFiles(`${projectPath}/chip`, /\.html$/);
}
