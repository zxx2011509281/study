
let fs = require('fs');
let request = require('request');
let path = require('path');

const retry = 3;
let htmlRegExp = /.html$/;
let uploadPath = 'http://sardine.trunk.koolearn.com/api/v1/file';
let productionPath = 'http://sardine.koolearn.com/api/v1/file';
/**
 * 上传文件目录到 cdn 上
 * @param {String} dir 要上传的文件目录
 * @param {String} token 存储桶 token
 * @param {Number} parallel 并行上传个数
 * @param {RegExp} include 正则表达,只有满足这个正则的才上传
 * @param {Boolean} isProduction 是否是生产环境
 */
module.exports = function uploadCDN({
  dir, token, prefix = '', parallel = 2, include, isProduction,
}) {
  if (!dir) {
    let tip = '文件目录是必填的';
    console.error(tip);
    return Promise.reject(tip);
  }
  if (!token) {
    let tip = '文件目录是必填的';
    console.error(tip);
    return Promise.reject(tip);
  }
  if (include && !(include instanceof RegExp)) {
    let tip = 'include 必须是正则表达式';
    console.error(tip);
    return Promise.reject(tip);
  }
  if (isProduction) {
    uploadPath = productionPath;
  }
  let stat = fs.statSync(dir);
  if (stat.isDirectory()) {
    return uploadDir(dir, token, prefix, parallel, include);
  }
  let tip = 'dir 应该是一个目录';
  console.error(tip);
  return Promise.reject(tip);
};

function uploadDir(dir, token, prefix, parallel, include) {
  let files = getFiles(dir);
  files = files.filter((file) => {
    return !htmlRegExp.test(file);
  }).filter((file) => {
    if (include) {
      return include.test(file);
    }
    return true;
  });
  // 并行上传个数
  let workingArr = files.splice(0, parallel);
  // 上传成功后继续处理其他文件
  function onSuccess(data) {
    let url1 = data[0].saveUri;
    let url2 = data[1].saveUri;
    let url3 = data[2].saveUri;
    console.log('文件访问路径', url1, url2, url3);
    let [file] = files.splice(0, 1);
    if (file) {
      return uploadFile(dir, file, token, prefix).then(retHandler).then(onSuccess, getOnFail(prefix, file, token));
    }
    return Promise.resolve('ok');
  }
  // 失败后重试
  function getOnFail(...args) {
    let time = retry;
    return function onFail(err) {
      console.log(err, time);
      if (time >= 1) {
        return uploadFile.apply(...args).then(retHandler).then(onSuccess, onFail);
      }
      let ret = `重试达到 ${retry} 次`;
      console.error(ret);
      return Promise.reject(ret);
    };
  }
  // 上传结果处理成对象
  function retHandler(body) {
    let ret = JSON.parse(body);
    if (ret.code === 200) {
      return ret.data;
    }
    throw body;
  }
  return Promise.all(workingArr.map((file) => {
    return uploadFile(dir, file, token, prefix)
      .then(retHandler)
      .then(onSuccess, getOnFail(prefix, file, token));
  }));
}
/**
 *  获取目录内文件列表
 * @param {String} dir 目录地址
 * @returns {Array} 文件列表
 */
function getFiles(dir) {
  let files = [];
  let direntList = fs.readdirSync(dir, { withFileTypes: true });
  direntList.forEach((dirent) => {
    if (dirent.isFile()) {
      files.push(dirent.name);
    } else if (dirent.isDirectory()) {
      getFiles(path.resolve(dir, dirent.name)).forEach((file) => {
        files.push(`${dirent.name}/${file}`);
      });
    }
  });
  return files;
}

function uploadFile(dir, filePath, token, prefix = '') {
  let options = {
    method: 'POST',
    url: uploadPath,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    formData: {
      uri: path.join('/', prefix, filePath).replace(/\\/g, '/'), // 兼容 windows
      file: fs.createReadStream(path.resolve(dir, filePath)),
    },
  };
  console.log('uploading:', filePath, prefix);
  return new Promise(function(resolve, reject) {
    request(options, function(error, response) {
      if (error) throw reject(new Error(error));
      resolve(response.body);
    });
  });
}
