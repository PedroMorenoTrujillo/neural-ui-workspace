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
const fixtureRoot = join(workspaceRoot, 'fixtures', 'table-body-section-template-typing');

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
  console.error('Invalid body-section Angular template fixture unexpectedly compiled.');
  process.exit(1);
}

if (!diagnostics.includes("Property 'missing' does not exist on type 'FixtureRow'")) {
  console.error('Data-entry row type diagnostic was not produced.');
  console.error(diagnostics);
  process.exit(1);
}

if (
  !diagnostics.includes("Property 'row' does not exist on type 'NeuTableBodyPlaceholderRenderEntry")
) {
  console.error('Placeholder no-fake-row diagnostic was not produced.');
  console.error(diagnostics);
  process.exit(1);
}

console.log(
  'Table body-section strict Angular template typing passed (valid accepted, invalid rejected).',
);
