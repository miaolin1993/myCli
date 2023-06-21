'use strict';

const path = require('path')

module.exports = (p) => {
  if (p && typeof p === 'string') {
    // 获取当前系统分隔符
    const sep = path.sep
    if (sep === '/') return p
    return p.replace(/\\/g, '/')
  }
  return p
}
