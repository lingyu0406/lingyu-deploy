const path = require('path');
const archiver = require('archiver');
const projectDir = process.cwd();
const fs = require('fs');
const childProcess = require('child_process');
const ora = require('ora');

const { NodeSSH } = require('node-ssh');
const { successLog, errorLog, underlineLog } = require('../utils/index');

let ssh = new NodeSSH();

async function deploy (config) {
  const { script, name, username, serverConfigs } = config;
  let serverConfig = {
    username
  };
  try {
    execBuild(script);
    await startZip('./build');
    if (serverConfigs && serverConfigs.length > 0) {
      // 一套代码部署多个服务器
      for (let i = 0; i < serverConfigs.length; i++) {
        serverConfig = {
          host: serverConfigs[i].host,
          username: serverConfigs[i].username,
          password: serverConfigs[i].password
        }
        await connectSSH(serverConfig);
        await uploadFile(serverConfigs[i].serverDir);
        await unzipFile(serverConfigs[i].serverDir);
      }
      await deleteLocalZip();
    }

    successLog(
      `\n 恭喜您，项目${underlineLog(
        name
      )}部署成功了^_^\n`
    );
    process.exit(0);
  } catch (err) {
    errorLog(`  部署失败 ${err}`);
    process.exit(1);
  }
}

function execBuild (script) {
  try {
    console.log(`\n（1）${script}`);
    const spinner = ora('正在打包中');
    spinner.start();
    childProcess.execSync(script, { cwd: projectDir });
    spinner.stop();
    successLog('  打包成功');
  } catch (err) {
    errorLog(err);
    process.exit(1);
  }
}

async function startZip (buildPath) {
  return new Promise((resolve, reject) => {
    buildPath = path.resolve(projectDir, buildPath);
    console.log('（2）打包 build 成zip');
    const archve = archiver('zip', {
      zlib: { level: 9 },
    }).on('error', (err) => {
      throw err;
    });

    const output = fs.createWriteStream(`${projectDir}/build.zip`);
    output.on('close', (err) => {
      if (err) {
        errorLog(`关闭 archiver 发生异常 ${err}`);
        reject(err);
        process.exit(1);
      }
      successLog('  zip打包成功');
      resolve();
    });

    archve.pipe(output);
    archve.directory(buildPath, '/');
    archve.finalize();
  });
}

async function connectSSH (config) {
  const { host, username, password } = config;
  const sshConfig = {
    host,
    port: '22',
    username,
    password,
  };

  try {
    console.log(`（3）连接${underlineLog(host)}`);
    await ssh.connect(sshConfig);
    successLog('  SSH连接成功');
  } catch (err) {
    errorLog(`  连接失败 ${err}`);
    process.exit(1);
  }
}

// 第四部，上传zip包
async function uploadFile (serverDir) {
  try {
    console.log(`（4）上传 zip 至目录${underlineLog(serverDir)}`);
    await runCommand(`rm -rf ${serverDir}`);
    await runCommand(`mkdir -p ${serverDir}`);
    await ssh.putFile(
      `${projectDir}/build.zip`,
      `${serverDir}/build.zip`,
      null,
      {
        concurrency: 1,
      }
    );
    successLog('  zip包上传成功');
  } catch (err) {
    errorLog(`  zip包上传失败 ${err}`);
    process.exit(1);
  }
}
// 运行命令
async function runCommand (command, serverDir) {
  await ssh.execCommand(command, { cwd: serverDir });
}

// 第五步，解压zip包
async function unzipFile (serverDir) {
  try {
    console.log('（5）开始解压zip包');
    await runCommand(`cd ${serverDir}`, serverDir);
    await runCommand('unzip -o build.zip && rm -f build.zip', serverDir);
    successLog('  zip包解压成功');
  } catch (err) {
    errorLog(`  zip包解压失败 ${err}`);
    process.exit(1);
  }
}

// 第六步，删除本地build.zip包
async function deleteLocalZip () {
  return new Promise((resolve, reject) => {
    console.log('（6）开始删除本地zip包');
    fs.unlink(`${projectDir}/build.zip`, (err) => {
      if (err) {
        errorLog(`  本地zip包删除失败 ${err}`, err);
        reject(err);
        process.exit(1);
      }
      successLog('  本地zip包删除成功\n');
      resolve();
    });
  });
}

module.exports = deploy;
