#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const packageJson = require('../package.json');
const program = require('commander');
const inquirer = require('inquirer');
const deployPath = path.join(process.cwd(), './deploy');
const deployConfigPath = `${deployPath}/deploy.config.js`;
const version = packageJson.version;
// const requiredNodeVersion = packageJson.engines.node;
const versionOptions = ['-V', '--version'];
const initOption = 'init'
const deployOptions = ['dev', 'test', 'prod']

const {
  checkNodeVersion,
  checkDeployConfig,
  errorLog,
  underlineLog,
  successLog,
} = require('../utils/index');

const { deleteFolderRecursive, writeConfig } = require('../lib/init');
const { resolve } = require('path');
const { rejects } = require('assert');

// checkNodeVersion(requiredNodeVersion, 'fe-deploy');

const agrs = process.argv.slice(2);

const firstArg = agrs[0];

// 无参数时默认输出help信息
if (!firstArg) {
  program.outputHelp();
}


if (fs.existsSync(deployConfigPath) && deployOptions.includes(firstArg)) { // dev、test、prod命令时，进入部署流程
  deploy();
} else if (initOption) { // init命令时，执行初始化部署的配置文件
  initConfig()
} else {
  errorLog('无效的配置 ./deploy/deploy.config.js');
}

// 初始化部署配置文件
function initConfig () {
  const config = 'deploy/deploy.config.js'
  program
    .command(`${initOption}`)
    .description(`初始化部署配置项`)
    .action(() => {
      // 检测是否第一次初始化配置（检查当前是否存在deploy/deploy.config.js文件，若没有，代表是第一次），如果不是，则走覆盖流程，否则开始初始化配置
      if (fs.existsSync(config)) {
        updateConfigInquirer()
      } else {
        inquirer.prompt([
          {
            type: 'confirm',
            message: `是否开始初始化部署配置？`,
            name: 'sure',
          },
        ])
          .then((answers) => {
            const { sure } = answers;
            if (!sure) {
              process.exit(1);
            }
            if (sure) {
              writeConfig()
            }
          })
      }
    })
  // 更新配置文件
  function updateConfigInquirer () {
    inquirer.prompt([
      {
        type: 'confirm',
        message: `deploy/deploy.config.js 已存在,是否覆盖原配置？`,
        name: 'sure',
      },
    ])
      .then((answers) => {
        const { sure } = answers;
        if (!sure) {
          process.exit(1);
        }
        if (sure) {
          // 删除原配置文件，重新创建配置文件
          deleteFolderRecursive(`deploy`).then(() => {
            writeConfig()
          })
        }
      })
  }
}

// 部署流程
function deploy () {
  // 检测部署配置是否合理
  const deployConfigs = checkDeployConfig(deployConfigPath);
  if (!deployConfigs) {
    errorLog('无效的配置 ./deploy/deploy.config.js');
    process.exit(1);
  }
  // 注册部署命令
  deployConfigs.forEach((config) => {
    const { command, projectName, name } = config;
    program
      .command(`${command}`)
      .description(`${underlineLog(projectName)}项目${underlineLog(name)}部署`)
      .action(() => {
        inquirer
          .prompt([
            {
              type: 'confirm',
              message: `${underlineLog(
                projectName
              )}项目是否部署到${underlineLog(name)}？`,
              name: 'sure',
            },
          ])
          .then((answers) => {
            const { sure } = answers;
            if (!sure) {
              process.exit(1);
            }
            if (sure) {
              const deploy = require('../lib/deploy');
              deploy(config);
            }
          });
      });
  });
}

program.parse(process.argv);
