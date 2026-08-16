import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sharedNpmCache = mkdtempSync(`${tmpdir()}/neural-ui-compatibility-npm-cache-`);

try {
  for (const version of ['19', '20', '21', '22']) {
    const result = spawnSync(
      'node',
      ['scripts/test-ui-core-compatibility.mjs', '--angular', version],
      {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, NEURAL_UI_COMPAT_NPM_CACHE: sharedNpmCache },
      },
    );
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
} finally {
  rmSync(sharedNpmCache, { recursive: true, force: true });
}
console.log('Angular 19–22 compatibility matrix passed');
