import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const ngc = join(
  workspaceRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'ngc.cmd' : 'ngc',
);
const fixtureRoot = join(workspaceRoot, 'fixtures', 'h5b4-template-typing');

function compile(configName) {
  return spawnSync(ngc, ['-p', join(fixtureRoot, configName)], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
}

const valid = compile('tsconfig.valid.json');
if (valid.status !== 0) {
  console.error(valid.stdout);
  console.error(valid.stderr);
  process.exit(valid.status ?? 1);
}

const invalid = compile('tsconfig.invalid.json');
const diagnostics = `${invalid.stdout}\n${invalid.stderr}`;
if (invalid.status === 0) {
  console.error('Invalid H5-B4 Angular template fixture unexpectedly compiled.');
  process.exit(1);
}

if (!diagnostics.includes("Property 'missing' does not exist")) {
  console.error('Invalid H5-B4 context-property diagnostic was not produced.');
  console.error(diagnostics);
  process.exit(1);
}

console.log('H5-B4 strict Angular template typing passed (valid accepted, invalid rejected).');
