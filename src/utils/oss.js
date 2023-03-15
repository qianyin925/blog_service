import fs from 'fs';
import path from 'path';
import OSS from 'ali-oss';
import tinify from '#utils/tinify';
import system from '#config/system';

const client = system.oss?.accessKeySecret ? new OSS(system.oss) : null;

/**
 * 处理文件名(要存入数据库的文件名)
 *
 * @param {string} sourceFileName 上传文件的源文件名
 * @param {boolean} isTinify 是否压缩
 * @returns {string} 返回文件名: klx. {当前环境}.{原文件名+时间戳的 base64 }.{文件后缀}
 */
const getFileName = (sourceFileName, isTinify) => {
  const extname = path.extname(sourceFileName);
  const unique = `${sourceFileName}${new Date().getTime()}`;
  const name = Buffer.from(unique).toString('base64');
  const env = process.env.NODE_ENV === 'development' ? 'dev' : 'pro';
  return `klx.${env}${isTinify ? '.tinify' : ''}.${name}${extname}`;
};

// 文件上传
export const upload = async ({ fileName, fileStream, filePath }) => {
  if (!client) {
    return;
  }

  const stream = fileStream
    ? fileStream
    : fs.createReadStream(filePath);
  const handledTinify = await tinify(stream); // 压缩
  const handledFileName = getFileName(fileName, !handledTinify.error); // 处理文件名

  return await client.putStream(handledFileName, handledTinify.stream); // 上传
};

export const span = null;
