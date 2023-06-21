'use strict';

const semver = require('semver')
const colors = require('colors/safe')
const config = require('./config')
const log = require('@miaolin1993-cli/log')


class Command {
  constructor(argv) {
    if (!argv) throw new Error('Command constructor 参数不能为空')
    if (!Array.isArray(argv)) throw new Error('Command constructor 参数类型错误, must be Array')
    if (argv.length < 1) throw new Error('Command constructor 参数列表内容不能为空')
    this._argv = argv
    new Promise((resolve, reject) => {
      let chain = Promise.resolve()
      chain = chain.then(() => this.checkNodeVersion())
      chain = chain.then(() => this.initArgs())
      chain = chain.then(() => this.init())
      chain = chain.then(() => this.exec())
      chain.catch(e => log.error(e.message))
    })
  }

  init() {
    throw new Error('init方法必须实现')
  }

  exec() {
    throw new Error('exec方法必须实现')
  }

  checkNodeVersion() {
    // 获取当前node版本号
    const currentVersion = process.version
    // 对比最低版本
    const lowVersion = config.LOW_NODE_VERSION
    if (!semver.gte(currentVersion, lowVersion)) {
      throw new Error(colors.red(`cli需要最低${lowVersion}以上的Node版本，当前版本为${currentVersion}，不满足需求`))
    }
    console.log(colors.green('Node Version check ok！'))
  }

  initArgs() {
    this._cmd = this._argv[this._argv.length - 1]
    this._argv = this._argv.slice(0, this._argv.length - 1)
  }
}

module.exports = Command;
