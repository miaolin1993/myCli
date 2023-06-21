'use strict';
const path = require('path')
const semver = require('semver')
const dedent = require('dedent')
const colors = require('colors/safe')
const userHome = require('user-home')
const commander = require('commander')

const pathExists = require('path-exists').sync
const log = require('@miaolin1993-cli/log')
const exec = require('@miaolin1993-cli/exec')
const pkg = require('../package.json')
const config = require('./config')

const program = new commander.Command()

async function core() {
  try {
    await prepare()
    registerCommand()
  } catch (e) {
    log.error(e.message)
    if (process.env.LOG_LEVEL === 'verbose') {
      console.error(e)
    }
  }
}

async function prepare() {
  checkPkgVersion()
  checkRoot()
  checkUserHome()
  checkEnv()
  await checkUpdate()
}

function checkPkgVersion() {
  log.notice('cli version：', pkg.version)
}

function checkRoot() {
  // root用户降级
  const rootCheck = require('root-check')
  rootCheck()
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录用户的用户主目录不存在'))
  }
}

function checkEnv() {
  const dotenvPath = path.resolve(userHome, '.env')
  const dotenv = require('dotenv')
  if (pathExists(dotenvPath)) dotenv.config({ path: dotenvPath })
  createDefaultConfig()
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = config.DEFAULT_CLI_HOME
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
}

// 检查版本更新
async function checkUpdate() {
  // 获取当前版本号和模块名
  const currentVersion = pkg.version
  const npmName = pkg.name
  // 调用npmApi获取所有版本号
  const { getNpmSemverVersion } = require('@miaolin1993-cli/get-npm-info')
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
  // 对比当前版本判断是否为最新
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(colors.yellow(dedent`更新提示： 当前npm包版本不是最新版，当前版本为${currentVersion}, 最新版本为${lastVersion}，请更新npm包版本。
    
    更新命令：npm install -g ${npmName}
    `))
  }
}

/****************** *********************/
function registerCommand() {
  const cliName = Object.keys(pkg.bin)[0]
  program
    .name(cliName)
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')

  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化', false)
    .action(exec)

  // 开启debug
  program.on('option:debug', function() {
    process.env.LOG_LEVEL = program.opts().debug ? 'verbose' : 'info'
    log.level = process.env.LOG_LEVEL
    log.verbose('debug start')
  })

  program.on('option:targetPath', function(obj) {
    process.env.CLI_TARGET_PATH = obj
  })

  // 未知命令监听
  program.on('command:*', function(obj) {
    console.log(colors.red('未知的命令: ' + obj[0]))
    console.log(colors.red('可输入: ' + cliName + ' -h 查看使用说明'))

  })

  // 没输入任何命令的情况
  // if (program.args && program.args.length < 1) {
  //   program.outputHelp()
  //   console.log(program.args)
  // }

  program.parse(process.argv)
}

module.exports = core;
