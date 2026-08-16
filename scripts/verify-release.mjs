import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const automatedOnly = process.argv.includes('--automated-only');
const automatedCommands = [
  ['npm', ['test']],
  ['npm', ['run', 'audit:entrypoint-coverage']],
  ['npm', ['run', 'build']],
  ['npm', ['run', 'audit:entrypoints']],
  ['npm', ['run', 'audit:showcase-evidence']],
  ['npm', ['run', 'audit:quality-matrix']],
  ['npm', ['run', 'audit:manual-at-evidence']],
  ['npm', ['run', 'audit:cva']],
  ['npm', ['run', 'audit:bundle']],
  ['npm', ['run', 'size-limit:built']],
  ['npm', ['run', 'audit:performance']],
  ['npm', ['run', 'audit:logical-css']],
  ['npm', ['run', 'audit:governance']],
  ['npm', ['run', 'audit:licenses']],
  ['npm', ['run', 'audit:security']],
  ['npm', ['run', 'audit:contracts']],
  ['npm', ['run', 'audit:docs']],
  ['npm', ['run', 'test:schematics']],
  ['npm', ['run', 'test:compat:matrix']],
  ['npm', ['run', 'test:imports']],
  ['npm', ['run', 'test:ssr-smoke']],
  ['npm', ['run', 'verify:package']],
  ['npm', ['run', 'audit:package']],
];
const humanEvidenceCommands = [['npm', ['run', 'audit:quality-matrix:strict']]];
const commands = automatedOnly
  ? automatedCommands
  : [...automatedCommands, ...humanEvidenceCommands];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { cwd: workspaceRoot, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(
  automatedOnly
    ? 'ui-core automated release verification passed'
    : 'ui-core release verification passed',
);
