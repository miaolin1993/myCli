'use strict';

const path = require('path')
const pathExists = require('path-exists')
const fse = require('fs-extra')
const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const log = require('@miaolin1993-cli/log')
const formatPath = require('@miaolin1993-cli/format-path')
const { isObject } = require('@miaolin1993-cli/utils')
const { getDefaultRegistry, getNpmLatestVersion } = require('@miaolin1993-cli/get-npm-info')

class Package {
  constructor(options) {
    if (!options || !isObject(options)) throw new Error('Package constructor 入参错误')
    const {
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    } = options
    // 包路径
    this.targetPath = targetPath
    // 包缓存路径
    this.storeDir = storeDir
    this.packageName = packageName
    this.packageVersion = packageVersion
    // package缓存目录前缀
    this.getCacheFilePathPrefix = this.packageName.replace('/', '_')
  }
  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      // 缓存目录不存在时创建
      fse.mkdirpSync(this.storeDir)
    }
    if (this.packageVersion === 'latest') {
      try {
        this.packageVersion = await getNpmLatestVersion(this.packageName)
      } catch(e) {
        throw new Error('远程获取包版本信息失败, 检查包名称是否正确')
      }
    }
  }
  // 判断当前包是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare()
      return pathExists(this.getCacheFilePath())
    } else {
      return pathExists(this.targetPath)
    }
  }

  getCacheFilePath() {
    // return path.resolve(this.storeDir, `_${this.getCacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    return path.resolve(this.storeDir, '.store', `${this.packageName}@${this.packageVersion}`)
  }

  getSpecificCacheFilePath(pkgVersion) {
    // return path.resolve(this.storeDir, `_${this.getCacheFilePathPrefix}@${pkgVersion}@${this.packageName}`)
    return path.resolve(this.storeDir, '.store', `${this.packageName}@${pkgVersion}`)
  }

  // 安装包
  install() {
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [{
        name: this.packageName,
        version: this.packageVersion }
      ]
    })
  }

  // 更新包
  async update() {
    await this.prepare()
    // 获取最新npm版本
    const latestVersion = await getNpmLatestVersion(this.packageName)
    // 查询最新版本号对应路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestVersion)
    // 如果不存在 则更新
    if (!await pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [{
          name: this.packageName,
          version: latestVersion
        }]
      })
    }
    if (this.packageVersion !== latestVersion) this.packageVersion = latestVersion
    log.verbose('当前npm最新版本为：', this.packageVersion)
  }

  // 获取入口文件路径
  getRootFilePath() {
    function _getRootFile(targetPath) {
      // 获取package.json所在目录
      const dir = pkgDir(targetPath)
      if (dir) {
        const pkgFile = require(path.resolve(dir, 'package.json'))
        // 寻找入口文件
        if (pkgFile && pkgFile.main) {
          // 路径兼容unix和windows
          return formatPath(path.resolve(dir, pkgFile.main))
        }
      }
      return null
    }
    return this.storeDir ? _getRootFile(this.getCacheFilePath) : _getRootFile(this.targetPath)
  }
}

module.exports = Package;
