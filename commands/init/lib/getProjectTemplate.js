'use strict'

const request = require('@miaolin1993-cli/request')


module.exports = () => {
  // 正常是请求接口，从mongoDB中取
  // return request({
  //   url: '/project/template'
  // })
  return [
      {
        id: 1,
        name: "vue3标准模板",
        npmName: "miaolin1993-cli-template-vue",
        npmVersion: "1.0.0",
        type: "normal",
        ignore: "**/template/**, node_modules",
        installCommand: "npm i --registry=https://registry.npm.taobao.org",
        startCommand: "npm run serve",
        tag: "project"
      },
      {
        id: 2,
        name: "vue管理后台模板",
        npmName: "miaolin1993-cli-template-vue-admin",
        npmVersion: "1.0.0",
        type: "normal",
        ignore: "**/template/**, node_modules",
        installCommand: "npm i --registry=https://registry.npm.taobao.org",
        startCommand: "npm run serve",
        tag: "project"
      },
      {
        id: 3,
        name: "组件库标准模板",
        npmName: "miaolin1993-cli-template-vue",
        npmVersion: "1.0.0",
        type: "normal",
        ignore: "**/template/**, node_modules",
        installCommand: "npm i --registry=https://registry.npm.taobao.org",
        startCommand: "npm run serve",
        tag: "component"
      },
    ]
}