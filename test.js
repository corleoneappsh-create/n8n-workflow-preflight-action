'use strict';
const assert = require('assert');
const path = require('path');
const { auditWorkflow, scan } = require('./main');

const good = scan(path.join(__dirname, 'fixtures/good.json'));
assert.strictEqual(good.length, 1);
assert.strictEqual(good[0].findings.filter(x => x.level === 'error').length, 0);

const bad = scan(path.join(__dirname, 'fixtures/bad.json'));
const codes = new Set(bad[0].findings.map(x => x.code));
for (const code of ['ACTIVE_EXPORT','WEBHOOK_PATH','HIGH_RISK_NODE','POSSIBLE_SECRET','HARDCODED_AUTH']) assert(codes.has(code), `missing ${code}`);
assert(bad[0].findings.filter(x => x.level === 'error').length >= 2);

const mixed = scan(__dirname);
assert(mixed.some(x => x.file.endsWith('good.json')));
assert(mixed.some(x => x.file.endsWith('bad.json')));
assert(!mixed.some(x => x.file.endsWith('package.json')));

const malformed = auditWorkflow({connections:{}});
assert(malformed.some(x => x.code === 'MISSING_NODES'));
console.log('tests: PASS');
