import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
for (const version of ['19', '20', '21', '22']) {
  const result = spawnSync('node', ['scripts/test-ui-core-compatibility.mjs', '--angular', version], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Angular 19–22 compatibility matrix passed');
