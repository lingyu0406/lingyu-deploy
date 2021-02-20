#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const {
  successLog,
  errorLog,
} = require('../utils/index');

const configPath = path.join(__dirname, "/config.js")

// 写入文件
function writeConfig () {
  // 读取预配置的deploy.config.js文件
  let result = fs.readFileSync(configPath)
  result = result.toString()
  // 在项目中创建deploy目录
  fs.mkdir("./deploy", function (err) {
    if (err) {
      errorLog('初始化deploy.config文件失败！-- 目录创建失败');
      return
    }
    // 在项目deploy目录中写入deploy.config.js
    fs.writeFileSync('deploy\\deploy.config.js', result, (err) => {
      if (err) {
        errorLog('初始化deploy.config文件失败！-- 写入配置文件失败');
        return false
      }
    })
    successLog('初始化成功！')
  });
}

// 移除已存在的配置目录
function deleteFolderRecursive (url) {
  return new Promise((resolve, reject) => {
    let files = [];
    /**
     * 判断给定的路径是否存在
     */
    if (fs.existsSync(url)) {
      /**
       * 返回文件和子目录的数组
       */
      files = fs.readdirSync(url);
      files.forEach(function (file, index) {

        const curPath = path.join(url, file);
        /**
         * fs.statSync同步读取文件夹文件，如果是文件夹，在重复触发函数
         */
        if (fs.statSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);

        } else {
          fs.unlinkSync(curPath);
        }
      });
      /**
       * 清除文件夹
       */
      fs.rmdirSync(url);
      resolve()
    } else {
      console.log(chalk.red('更新deploy.config文件失败！-- 删除已有配置文件失败'));
      reject()
    }
  })

}

module.exports = {
  deleteFolderRecursive,
  writeConfig
};
