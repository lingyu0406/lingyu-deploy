#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const semver = require('semver');

const DEPLOY_SCHEMA = {
  name: '',
  script: "",
  serverConfigs: [
    {
      host: '',
      port: 22,
      username: '',
      password: '',
      serverDir: ''
    }
  ]
};

const PRIVATE_KEY_DEPLOY_SCHEMA = {
  name: '',
  script: "",
  host: '',
  port: 22,
  serverDir: ''
};

// 开始部署日志
function startLog (...content) {
  console.log(chalk.magenta(...content));
}

// 信息日志
function infoLog (...content) {
  console.log(chalk.blue(...content));
}

// 成功日志
function successLog (...content) {
  console.log(chalk.green(...content));
}

// 错误日志
function errorLog (...content) {
  console.log(chalk.red(...content));
}

// 下划线重点输出
function underlineLog (content) {
  return chalk.blue.underline.bold(`${content}`);
}

// 检查node版本是否符合特定范围
function checkNodeVersion (wanted, id) {
  if (!semver.satisfies(process.version, wanted)) {
    errorLog(`You ar using Node ${process.version}, but this version of ${id} requres Node ${wanted} .\nPlease upgrage your Node version.`);
    process.exit(1);
  }
}

// 检查配置是否符合特定schema
function checkConfigScheme (configKey, configObj, privateKey) {
  let deploySchema = null;
  let neededKeys = [];
  let neededServerKeys = [];
  let neededListKey = null;
  let unConfigedKeys = false;
  let configValid = true;
  if (privateKey) {
    deploySchema = PRIVATE_KEY_DEPLOY_SCHEMA;
  } else {
    deploySchema = DEPLOY_SCHEMA;
  }
  for (let schemaKey in deploySchema) {
    if (!configObj.hasOwnProperty(schemaKey)) {
      neededKeys.push(schemaKey)
    }
    if (configObj[schemaKey] == '') {
      unConfigedKeys = true
    }
    if (configObj[schemaKey] instanceof Array) {
      let schemaChildObj = deploySchema[schemaKey][0];
      let schemaChildKeys = Object.keys(schemaChildObj);
      configObj[schemaKey].forEach((item) => {
        let configKeys = Object.keys(item)
        schemaChildKeys.map(key => {
          if (!configKeys.includes(key)) {
            neededListKey = schemaKey
            neededServerKeys.push(key)
          }
        })

        for (let k in item) {
          if (item[k] === '') {
            unConfigedKeys = true
          }
        }
      })
    }
  }

  const neededMsg = neededServerKeys && neededServerKeys.length > 0 ? `${configKey}中${neededKeys.join(',')}及${neededListKey}中${neededServerKeys}配置项缺失，请检查配置` : `${configKey}中${neededKeys.join(',')}配置项缺失，请检查配置`
  if (neededKeys.length > 0 || neededListKey) {
    errorLog(neededMsg);
    configValid = false;
  }
  if (unConfigedKeys) {
    errorLog(`${configKey}中有未配置项，请设置`);
    configValid = false;
  }
  return configValid;
}

// 检查deploy配置是否合理
function checkDeployConfig (deployConfigPath) {
  if (fs.existsSync(deployConfigPath)) {
    const config = require(deployConfigPath);
    const { privateKey, passphrase, projectName } = config;
    const keys = Object.keys(config);
    const configs = [];
    for (let key of keys) {
      if (config[key] instanceof Object) {
        if (!checkConfigScheme(key, config[key], privateKey)) {
          return false;
        }
        config[key].command = key;
        config[key].privateKey = privateKey;
        config[key].passphrase = passphrase;
        config[key].projectName = projectName;
        configs.push(config[key]);
      }
    }
    return configs;
  }
  infoLog(`缺少部署相关的配置，请运行${underlineLog('deploy init')}下载部署配置`);
  return false;
}

module.exports = {
  startLog,
  infoLog,
  successLog,
  errorLog,
  underlineLog,
  checkNodeVersion,
  checkDeployConfig
};
