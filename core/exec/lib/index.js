'use strict';

const path = require('path')
const log = require('@miaolin1993-cli/log') 
const { exec: spawn } = require('@miaolin1993-cli/utils') 
const Package = require('@miaolin1993-cli/package');

const packagePrefix = '@miaolin1993-cli/'
const CACHE_DIR = 'dependencies'

async function exec() {
  const homePath = process.env.CLI_HOME_PATH
  const cmdObj = arguments[arguments.length - 1]
  const packageName = packagePrefix + cmdObj.name()
  let targetPath = process.env.CLI_TARGET_PATH
  let storeDir = ''
  let pkg

  if (!targetPath) {
    // 生成缓存路径
    targetPath = path.resolve(homePath, CACHE_DIR)
    storeDir = path.resolve(targetPath, 'node_modules')

    pkg = new Package({
      targetPath,
      storeDir,
      packageVersion: 'latest',
      packageName
    })
    if (await pkg.exists()) {
      // 更新包
      console.log('启动更新')
      await pkg.update()
    } else {
      console.log('启动下载')
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      storeDir: '',
      packageName,
      packageVersion: 'latest'
    })
  }

  const rootFile = pkg.getRootFilePath()
  if (rootFile) {
    try {
      const args = Array.from(arguments)
      const cmd = args[args.length - 1]
      const obj = Object.create(null)
      Object.keys(cmd).forEach(key => {
        if (cmd.hasOwnProperty(key) && !key.startsWith('_') && !['parent'].includes(key)){
          obj[key] = cmd[key]
        }
      })
      args[args.length - 1] = obj
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`
      const child = spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit', // 聚合子进程信息传给父进程
        // shell: true
      })
      child.on('error', e => {
        log.error(e.message)
        process.exit(1)
      })
      child.on('exit', e => {
        log.verbose('子进程执行成功', e)
        process.exit(e)
      })
    } catch(e) {
      log.error(e.message)
    }
  }
}

module.exports = exec;
