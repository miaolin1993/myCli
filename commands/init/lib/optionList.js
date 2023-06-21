const semver = require('semver')

function isValid(v) {
  return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)
}

const getOptionList = (type, template, name = '') => {
  const templateList = template.filter(t => t.tag.includes(type))
  const typeList = ['project', 'component']
  if (!typeList.includes(type)) throw new Error('无法识别的type类型', type)

  const title = type === 'project' ? 'project' : 'component'
  return [
    {
      type: 'input',
      name: `${type}Name`,
      message: `请输入${title}名称:`,
      default: (name && isValid(name)) ? name : '',
      validate(v) {
        // 首字符必须英文字符，字符仅允许-和_
        // 结尾字符必须英文或数字
        const done = this.async()
  
        setTimeout(() => {
          if (!isValid(v)) {
            done('名称不合法 参考aaa aaa-bbb aaa_bbb）')
            return
          }
          done(null, true)
        }, 0)
      }
    },
    {
      type: 'input',
      name: `${type}Version`,
      message: '请输入版本号:',
      default: '1.0.0',
      validate(v) {
        const done = this.async()
  
        setTimeout(() => {
          if (!(!!semver.valid(v))) {
            done('版本号不合法 参考1.0.0）')
            return
          }
          done(null, true)
        }, 0)
      },
      filter(v) {
        if (!!semver.valid(v)) return semver.valid(v)
        return v
      }
    },
    {
      type: 'input',
      name: `${type}Description`,
      message: '请输入描述信息:',
      default: '',
    },
    {
      type: 'list',
      name: `${type}Template`,
      message: `请选择${type}模板：`,
      choices: templateList.map(val => {
        if (val.name && val.npmName) {
          return {
            name: val.name,
            value: val.npmName
          }
        }
      })
    }
  ]
}



module.exports = getOptionList