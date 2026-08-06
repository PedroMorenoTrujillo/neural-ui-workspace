import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const commands = [
  ['npm', ['test']],
  ['npm', ['run', 'build']],
  ['npm', ['run', 'audit:entrypoints']],
  ['npm', ['run', 'audit:cva']],
  ['npm', ['run', 'audit:bundle']],
  ['npm', ['run', 'audit:logical-css']],
  ['npm', ['run', 'audit:contracts']],
  ['npm', ['run', 'audit:docs']],
  ['npm', ['run', 'test:schematics']],
  ...(process.env['NEURAL_UI_FULL_MATRIX'] === '1'
    ? [['npm', ['run', 'test:compat:matrix']]]
    : []),
  ['npm', ['run', 'test:imports']],
  ['npm', ['run', 'test:ssr-smoke']],
  ['npm', ['run', 'verify:package']],
  ['npm', ['run', 'audit:package']],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { cwd: workspaceRoot, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('ui-core release verification passed');
