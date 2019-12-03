
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const qiniu = require('qiniu');
const stream = require('stream');
const systemConfig = require('../config/system');

const { qiniu: { bucket, accessKey, secretKey } } = systemConfig;

/**
 * 将 buffer 转为 Stream
 * @param {Buffer} buffer 二进制内容
 * @return {Stream}
 */
const bufferToStream = (buffer) => {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(buffer);
  bufferStream.pipe(process.stdout)
  return bufferStream;
}

/**
 * 七牛云对象存储 - 获取上传凭证
 */
const getUptoken = () => {
  const putPolicy = new qiniu.rs.PutPolicy({ scope: bucket });
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  return putPolicy.uploadToken(mac);
}

/**
 * 七牛云对象存储 -获取 Bucket Manager
 * @param {String} path       文件路径
 * @param {String} fileName   文件命名
 */
const getBucketManager = () => {
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const config = new qiniu.conf.Config();
  return new qiniu.rs.BucketManager(mac, config);
}

/**
 * 七牛云对象存储 - 文件流上传文件, 通过路径或者传入二进制的形式上传
 * @param {String} path       文件路径
 * @param {Buffer} fileBuffer 文件二进制
 * @param {String} fileName   文件命名
 */
module.exports.upload = ({ path, fileName, fileBuffer }) => new Promise((resolve, reject) => {
  const { qiniu: { zone, cdn } } = systemConfig;
  const uploadToken = getUptoken();
  const putExtra = new qiniu.form_up.PutExtra();
  const config = new qiniu.conf.Config();
  // 设置存储区域(华南)
  config.zone = qiniu.zone[zone];
  const formUploader = new qiniu.form_up.FormUploader(config);
  // 读取文件流
  const readStream = path
    ? fs.createReadStream(path)
    : bufferToStream(fileBuffer);

  // 使用流的方式进行上传
  formUploader.putStream(uploadToken, fileName, readStream, putExtra, (...args) => {
    const [ respErr, respBody, respInfo ] = args;
    if (respErr){
      reject(respErr);
    } else {
      respBody.key && (respBody.url = `${cdn}/${respBody.key}`);
      resolve({ respBody, respInfo });
    }
  });
});

/**
 * 七牛云对象存储 - 文件重命名(使用的是移动命令)
 * @param {object[]}} files      要重命名的文件以及对应要修改的文件名列表{ src, dest }
 * @return {Boolean} 返回删除状态： 成功　true 失败 false
 */
module.exports.update = (files = []) => new Promise((resolve, reject) =>  {
  const bucketManager = getBucketManager();
  const deleteOperations = files.map(v => (
    qiniu.rs.moveOp(bucket, v.src, bucket, v.dest)
  ));
  bucketManager.batch(deleteOperations, (err, respBody, respInfo) => {
    resolve(!err);
  });
});

/**
 * 七牛云对象存储 - 批量删除文件
 * @param {String} files      要删除的文件(文件名)列表
 */
module.exports.delete = (files = []) => {
  const bucketManager = getBucketManager();
  var deleteOperations = files.map(v => (
    qiniu.rs.deleteOp(bucket, 'NzQ4NTcxMjVfcDAucG5nMTU3MDAwNzUzMzAxOA==.png')
  ));

  bucketManager.batch(deleteOperations, function(err, respBody, respInfo) {
    console.log('============>>');
  });
}
