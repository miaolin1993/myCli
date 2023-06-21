'use strict';
const { rejects } = require('assert');
const cp = require('child_process');
const { resolve } = require('path');

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

function spinnerStart(msg, str) {
  const Spinner = require('cli-spinner').Spinner
  const spinner = new Spinner(msg + '%s')
  spinner.setSpinnerString(str)
  spinner.start()
  return spinner
}

function sleep(timeout = 1000) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}
// 执行命令
function exec(command, args, options) {
  const win32 = process.platform === 'win32'
  const cmd = win32 ? 'cmd' : command
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args
  return cp.spawn(cmd, cmdArgs, options || {})
}
// 执行命令 promise
function execAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = exec(command, args, options)
    p.on('error', e => reject(e))
    p.on('exit', c => resolve(c))
  })
}

module.exports = {
  isObject,
  spinnerStart,
  sleep,
  exec,
  execAsync
}
