'use strict'

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const glob = require('glob')
const ejs = require('ejs')
const inquirer = require('inquirer')
const userHome = require('user-home')
const log = require('@miaolin1993-cli/log')
const Command = require('@miaolin1993-cli/command')
const Package = require('@miaolin1993-cli/package')
const { spinnerStart, execAsync } = require('@miaolin1993-cli/utils')
const getTemplate = require('./getProjectTemplate')
const getOptionList = require('./optionList')


const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'
class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = this._argv[1].force
    log.verbose('projectName: ', this.projectName)
    log.verbose('force: ', this.force)
  }

  async exec() {
    try {
      // 初始化阶段
      const projectInfo = await this.prepare()
      if (projectInfo) {
        this.projectInfo = projectInfo
        // 下载模板
        await this.downloadTemplate()
        // 安装模板
        await this.installTemplate()
      }
    } catch(e) {
      log.error(e.message)
    }
  }

  async installTemplate() {
    if (this.templateRes) {
      if (!this.templateRes.type) {
        this.templateRes.type = TEMPLATE_TYPE_NORMAL
      } else {
        if (this.templateRes.type === TEMPLATE_TYPE_NORMAL) {
          // 标准安装
          await this.installNormalTemplate()
        } else if (this.templateRes.type === TEMPLATE_TYPE_CUSTOM) {
          // 自定义安装
          await this.installCustomTemplate()
        } else {
          throw new Error('项目模板类型无法识别')
        }
      }
    } else {
      throw new Error('项目模板信息不存在')
    }
  }

  ejsRender(ignore) {
    const projectInfo = {
      packageVersion: this.projectInfo.projectVersion,
      ...this.projectInfo
    }
    const dir = process.cwd()
    return new Promise(async (resolve, reject) => {
      const files = await glob('**', {
        cwd: process.cwd(),
        nodir: true,
        ignore
      })
      if (!files) throw new Error('获取模板下文件路径失败')
      if (files && files.includes('package.json')) {
        ejs.renderFile(path.resolve(dir, 'package.json'), projectInfo, {}, (err, str) => {
          if (err) reject(err)
          if (str) fse.writeFileSync(path.resolve(dir, 'package.json'), str)
          resolve(str)
        })
      }
    })
  }

  async installNormalTemplate() {
    try {
      const targetPath = process.cwd()
      const templatePath = path.resolve(this.templateNpm.getCacheFilePath(), 'node_modules', this.templateNpm.packageName, 'template')
      log.verbose('模板路径：', templatePath)
      log.verbose('当前路径：', targetPath)
      log.verbose('包信息：', this.templateRes)
      // 检查路径是否存在
      fse.ensureDirSync(templatePath)
      // 将模板代码复制到当前目录
      fse.copySync(templatePath, targetPath)
    } catch (e) {
      throw new Error(e)
    }
    // ejs渲染
    const ignore = [
      ...this.templateRes.ignore,
      'node_modules/**',
      'publish/**',
      'src/**'
    ]
    const ejsRes = await this.ejsRender(ignore)
    if (!ejsRes) throw new Error('ejs渲染失败')
    // 依赖安装
    const { installCommand, startCommand } = this.templateRes
    if (installCommand) {
      log.info('开始安装依赖......')
      const installRes = await this.execByNpmString(installCommand)
      if (installRes !== 0) throw new Error('依赖安装失败')

      // 执行启动命令
      if (startCommand) {
        log.success('依赖安装成功，开始启动项目')
        const startRes = await this.execByNpmString(startCommand)
        if (startRes !== 0) throw new Error('项目启动失败')
      }
    } 

  }
  // 根据npm字符串执行启动命令
  async execByNpmString(str) {
    const whiteList = ['npm', 'cnpm', 'pnpm', 'yarn']
    const cmd = str.split(' ')[0]
    if (!whiteList.includes(cmd)) throw new Error(`待执行的命令'${cmd}' 不在可执行命令的白名单${whiteList}内`)
    const args = str.split(' ').slice(1)
    return await execAsync(cmd, args, {
      stdio: 'inherit', // 子进程执行日志会在主进程显示
      cwd: process.cwd()
    })
  }

  async installCustomTemplate() {
    console.log('自定义')
  }

  async prepare() {
    // const template = await getTemplate()
    const template = getTemplate()
    if (!template || template.length.length === 0) throw new Error('项目模板不存在')
    this.template = template.filter(val => val.name)

    const localPath = process.cwd()
    if (!this.dirIsEmpty(localPath)) {
      let toNext = false
      
      if (!this.force) {
        const { toNext: userToNext } = await inquirer.prompt({
          type: 'confirm',
          name: 'toNext',
          message: `当前目录不为空，是否继续？（继续会清空${localPath}下所有文件）`,
          default: false
        })
        toNext = userToNext
        if (!toNext) return
      }
      if (toNext || this.force) {
        const { confirmChoose } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmChoose',
          message: `请再次确认是否清空目录下所有文件(${localPath})`,
          default: false
        })
        if (confirmChoose) {
          // **高危操作清空目录下所有文件
          fse.emptyDirSync(localPath)
        }
      }
    }
    return await this.getProjectInfo()
  }
  // 当前目录是否为空
  dirIsEmpty(dirPath) {
    const files = fs.readdirSync(dirPath)
    const res = files.filter(name => {
      return !name.startsWith('.') &&
      !['node_modules'].includes(name)
    })
    return !res || res.length <= 0
  }

  async getProjectInfo() {
    let projectInfo = {}
    // 创建项目or组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择要创建的项目类型',
      default: TYPE_PROJECT,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT
        },
        {
          name: '组件',
          value: TYPE_COMPONENT
        }
      ]
    })
    const templateList = this.template
    if (type === TYPE_PROJECT) {
      const res = await inquirer.prompt(getOptionList(type, templateList, this.projectName))
      projectInfo = {
        type,
        ...res
      }
    }
    // 如果项目类型是组件
    if (type === TYPE_COMPONENT) {
      const res = await inquirer.prompt(getOptionList(type, templateList, this.projectName))
      projectInfo = {
        type,
        ...res
      }
      return
    }
    // 对项目名称进行处理
    if (projectInfo.projectName) {
      projectInfo.finallyProjectName = require('kebab-case')(projectInfo.projectName).replace(/^-/, '')
    }
    if (projectInfo.componentName) {
      projectInfo.finallyComponentName = require('kebab-case')(projectInfo.componentName).replace(/^-/, '')
    }
    return projectInfo
  }
  async downloadTemplate() {
    const { projectTemplate } = this.projectInfo
    const templateRes = this.template.find(val => val.npmName === projectTemplate)
    this.templateRes = templateRes
    const templateNpm = new Package({
      targetPath: path.resolve(userHome, '.cli', 'template'),
      storeDir: path.resolve(userHome, '.cli', 'template', 'node_modules'),
      packageName: templateRes.npmName,
      packageVersion: templateRes.npmVersion
    })
    if (!await templateNpm.exists()) {
      await this.handlePackage(templateNpm, 'install')
    } else {
      await this.handlePackage(templateNpm, 'update')
    }
  }

  async handlePackage(templateNpm, type) {
    const obj = {
      install: '下载',
      update: '更新'
    }
    const spinner = spinnerStart(`正在${obj[type]}模板..\n`, '|/-\\')
    try {
      if (type === 'install') await templateNpm.install()
      if (type === 'update') await templateNpm.update()
    } catch(e) {
      throw e
    } finally {
      spinner.stop(true)
      if (await templateNpm.exists()) {
        log.success(`模板${obj[type]}成功`)
        this.templateNpm = templateNpm
      }
    }
  }
}

function init(argv) {
  // console.log(projectName, obj, a.parent.opts().targetPath)
  return new InitCommand(argv)
}

module.exports = init
module.exports.initCommand = InitCommand;
