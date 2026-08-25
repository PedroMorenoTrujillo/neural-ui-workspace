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
const fixtureRoot = join(workspaceRoot, 'fixtures', 'option-api-template-typing');

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
  console.error('Invalid Option API Angular template fixture unexpectedly compiled.');
  process.exit(1);
}

if (!diagnostics.includes("Property 'missing' does not exist")) {
  console.error('Invalid option-property diagnostic was not produced.');
  console.error(diagnostics);
  process.exit(1);
}

if (
  !diagnostics.includes("Argument of type 'number' is not assignable to parameter of type 'string'")
) {
  console.error('Invalid filter-callback diagnostic was not produced.');
  console.error(diagnostics);
  process.exit(1);
}

console.log('Option API strict Angular template typing passed (valid accepted, invalid rejected).');
