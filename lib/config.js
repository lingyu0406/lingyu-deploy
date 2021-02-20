module.exports = {
  projectName: 'XXX 管理后台', // 项目名称
  dev: {
    name: '开发环境',
    script: 'npm run build:dev', // 开发环境打包脚本
    serverConfigs: [  // 服务器列表，打包的一套代码部署多台服务器，几台服务器，列表配置几项
      {
        host: '', // 服务器host地址
        port: 22, // ssh port，一般默认22
        username: '', // 登录服务器用户名
        password: '', // 登录服务器密码
        serverDir: '', // 部署到服务器XX路径
      }
    ]
  },
  test: {
    name: '测试环境',
    script: 'npm run build:test', // 测试环境打包脚本
    serverConfigs: [  // 服务器列表
      {
        host: '', // 服务器host地址
        port: 22, // ssh port，一般默认22
        username: '', // 登录服务器用户名
        password: '', // 登录服务器密码
        serverDir: '', // 部署到服务器XX路径
      }
    ]
  }
};
