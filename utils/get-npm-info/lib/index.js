'use strict';

const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')

function getDefaultRegistry(isOriginal = false) {
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

function getNpmInfo(npmName, registry) {
 if (!npmName) return null
 const registryUrl = registry || getDefaultRegistry()
 const npmInfoUrl = urlJoin(registryUrl, npmName)
 return axios.get(npmInfoUrl).then(res => {
  if (res.status === 200) return res.data
  return null
 }).catch(e => Promise.reject(e))
}
// 获取npm包所有版本
async function getNpmVersions(npmName, registry) {
  const info = await getNpmInfo(npmName, registry)
  if (info.versions) return Object.keys(info.versions)
  return []
}

function getSemverVersions(baseVersion, versions) {
  return versions.filter(v => semver.satisfies(v, `^${baseVersion}`)).sort((a, b) => semver.gt(b, a))
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  const newVersions = getSemverVersions(baseVersion, versions)
  if (newVersions && newVersions.length) return newVersions[0]
  return null
}

async function getNpmLatestVersion(npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  const versionLists = versions.sort((a, b) => semver.gt(b, a) - semver.gt(a, b))
  console.log('当前npm存在版本：', versionLists)
  if (versions) return versionLists[0]
  return null     
}


module.exports = {
  getNpmInfo,
  getNpmVersions,
  getNpmSemverVersion,
  getDefaultRegistry,
  getNpmLatestVersion
}
