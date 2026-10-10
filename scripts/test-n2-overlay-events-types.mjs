import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ngc = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ngc.cmd' : 'ngc');
const result = spawnSync(
  ngc,
  ['-p', join(root, 'fixtures/n2-overlay-events-typing/tsconfig.json')],
  { cwd: root, encoding: 'utf8' },
);
if (result.status !== 0) {
  console.error(`${result.stdout}\n${result.stderr}`);
  process.exit(result.status ?? 1);
}
console.log('N2-022 overlay/event type contracts passed.');
