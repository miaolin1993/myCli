'use strict';

const { getNpmInfo } = require('..');
const assert = require('assert').strict;

assert.strictEqual(getNpmInfo(''), null);
console.info('getNpmInfo tests passed');
