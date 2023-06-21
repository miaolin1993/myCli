'use strict';

const log = require('npmlog')

// 判断模式是否是开发模式
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'

// 在log内容前面加个前缀
// log.heading = 'miaolin'
// log.headingStyle = { fg: 'white', bg: 'black'}

// 自定义log级别
log.addLevel('success', 2000, { fg: 'green', bold: true })


module.exports = log;
