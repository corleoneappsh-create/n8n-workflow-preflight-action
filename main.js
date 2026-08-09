'use strict';
const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = [
  ['OpenAI-style key', /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ['GitHub token', /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/g],
];
const HIGH_RISK_TYPES = [
  'n8n-nodes-base.executeCommand',
  'n8n-nodes-base.ssh',
];

function walkStrings(value, visit, keyPath = '$') {
  if (typeof value === 'string') return visit(value, keyPath);
  if (Array.isArray(value)) return value.forEach((v, i) => walkStrings(v, visit, `${keyPath}[${i}]`));
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walkStrings(v, visit, `${keyPath}.${k}`);
  }
}

function finding(level, code, message, location = '') { return { level, code, message, location }; }

function auditWorkflow(doc) {
  const out = [];
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return [finding('error','INVALID_ROOT','Workflow root must be a JSON object.')];
  if (!Array.isArray(doc.nodes)) out.push(finding('error','MISSING_NODES','Expected a top-level nodes array.'));
  if (doc.connections == null || typeof doc.connections !== 'object') out.push(finding('warning','MISSING_CONNECTIONS','Expected a top-level connections object.'));
  if (doc.active === true) out.push(finding('warning','ACTIVE_EXPORT','Workflow export is active; review before deploying into another environment.'));

  const nodes = Array.isArray(doc.nodes) ? doc.nodes : [];
  const names = new Set();
  for (const [i, node] of nodes.entries()) {
    const loc = `nodes[${i}]`;
    if (!node || typeof node !== 'object') { out.push(finding('error','INVALID_NODE','Node entry must be an object.',loc)); continue; }
    if (!node.name || typeof node.name !== 'string') out.push(finding('error','NODE_NAME','Node is missing a string name.',loc));
    else if (names.has(node.name)) out.push(finding('warning','DUPLICATE_NODE_NAME',`Duplicate node name: ${node.name}`,loc));
    else names.add(node.name);
    if (!node.type || typeof node.type !== 'string') out.push(finding('error','NODE_TYPE','Node is missing a string type.',loc));
    if (HIGH_RISK_TYPES.includes(node.type)) out.push(finding('warning','HIGH_RISK_NODE',`Review high-impact node type: ${node.type}`,loc));
    if (node.type === 'n8n-nodes-base.webhook' && !(node.parameters && node.parameters.path)) out.push(finding('warning','WEBHOOK_PATH','Webhook node has no explicit path.',loc));

    walkStrings(node.parameters || {}, (s, p) => {
      for (const [label, re] of SECRET_PATTERNS) {
        re.lastIndex = 0;
        if (re.test(s)) out.push(finding('error','POSSIBLE_SECRET',`${label} appears hardcoded in workflow parameters.`,`${loc}.${p}`));
      }
      if (/authorization/i.test(p) && /^(?:Bearer|Basic)\s+\S+/i.test(s) && !s.includes('{{')) {
        out.push(finding('error','HARDCODED_AUTH','Authorization value appears hardcoded instead of credential-backed.',`${loc}.${p}`));
      }
    });
  }
  return out;
}

function listJson(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.toLowerCase().endsWith('.json') ? [target] : [];
  const files = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (['.git','node_modules'].includes(entry.name)) continue;
    const p = path.join(target, entry.name);
    if (entry.isDirectory()) files.push(...listJson(p));
    else if (entry.name.toLowerCase().endsWith('.json')) files.push(p);
  }
  return files;
}

function scan(target) {
  const explicitFile = fs.statSync(target).isFile();
  const files = listJson(target);
  const results = [];
  for (const file of files) {
    try {
      const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
      const workflowLike = doc && typeof doc === 'object' && !Array.isArray(doc) && (Array.isArray(doc.nodes) || doc.connections != null);
      if (!explicitFile && !workflowLike) continue;
      results.push({ file, findings: auditWorkflow(doc) });
    } catch (e) {
      if (explicitFile) results.push({ file, findings: [finding('error','INVALID_JSON',`Invalid JSON: ${e.message}`)] });
    }
  }
  return results;
}

function esc(s) { return String(s).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A'); }
function setOutput(name, value) {
  const f = process.env.GITHUB_OUTPUT;
  if (f) fs.appendFileSync(f, `${name}=${String(value).replace(/\n/g,' ')}\n`);
}
function run() {
  const target = process.env.INPUT_PATH || process.argv[2] || '.';
  const failOn = (process.env['INPUT_FAIL-ON'] || process.env.INPUT_FAIL_ON || process.argv[3] || 'error').toLowerCase();
  if (!fs.existsSync(target)) { console.error(`::error::Path not found: ${esc(target)}`); process.exit(2); }
  const results = scan(target);
  let errors = 0, warnings = 0;
  for (const r of results) for (const f of r.findings) {
    if (f.level === 'error') errors++; else warnings++;
    const cmd = f.level === 'error' ? 'error' : 'warning';
    console.log(`::${cmd} file=${esc(r.file)}::[${f.code}] ${esc(f.message)}${f.location ? ` (${esc(f.location)})` : ''}`);
  }
  const summary = { files: results.length, errors, warnings };
  console.log(`n8n Workflow Preflight: ${summary.files} file(s), ${errors} error(s), ${warnings} warning(s)`);
  setOutput('files', summary.files); setOutput('errors', errors); setOutput('warnings', warnings); setOutput('summary-json', JSON.stringify(summary));
  if ((failOn === 'warning' && (errors + warnings) > 0) || (failOn === 'error' && errors > 0)) process.exit(1);
}

module.exports = { auditWorkflow, listJson, scan };
if (require.main === module) run();
