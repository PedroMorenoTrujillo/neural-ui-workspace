import { mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = new URL('..', import.meta.url).pathname;
const cache = mkdtempSync(join(tmpdir(), 'neural-ui-package-audit-'));
const env = { ...process.env, npm_config_cache: cache };
const commands = [
  ['publint', ['dist/neural-ui/core']],
  ['attw', ['--pack', 'dist/neural-ui/core', '--ignore-rules', 'cjs-resolves-to-esm', 'no-resolution']],
];

try {
  for (const [command, args] of commands) {
    const binary = join(root, 'node_modules/.bin', command);
    const result = spawnSync(binary, args, { cwd: root, env, stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
} finally {
  rmSync(cache, { recursive: true, force: true });
}
