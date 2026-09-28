import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const bundleProfile = process.env['NEURAL_UI_BUNDLE_PROFILE'] ?? 'main';
if (!['pr', 'main', 'release'].includes(bundleProfile)) {
  throw new Error(`Unsupported NEURAL_UI_BUNDLE_PROFILE: ${bundleProfile}`);
}
const commands = [
  ['npm', ['run', 'test:coverage:gate']],
  ['npm', ['run', 'test:coverage']],
  ['npm', ['run', 'test:release-artifacts']],
  ['npm', ['run', 'build']],
  ['npm', ['run', 'prepare:release-artifacts']],
  ['npm', ['run', 'audit:entrypoints']],
  ['npm', ['run', 'audit:cva']],
  ['npm', ['run', `audit:bundle:${bundleProfile}`]],
  ['npm', ['run', 'audit:table-architecture']],
  ['npm', ['run', 'audit:h5c2-duplication']],
  ['npm', ['run', 'audit:logical-css']],
  ['npm', ['run', 'audit:contracts']],
  ['npm', ['run', 'audit:docs']],
  ['npm', ['run', 'test:angular-compatibility']],
  ['npm', ['run', 'test:table-body-section-template-types']],
  ['npm', ['run', 'test:schematics']],
  ...(process.env['NEURAL_UI_ANGULAR_22_CONSUMER'] === '1'
    ? [['npm', ['run', 'test:angular-22-consumer']]]
    : []),
  ['npm', ['run', 'test:imports']],
  ['npm', ['run', 'test:ssr-smoke']],
  ['npm', ['run', 'verify:package']],
  ['npm', ['run', 'audit:package']],
  ['npm', ['run', 'verify:release-artifacts']],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { cwd: workspaceRoot, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('ui-core release verification passed');
