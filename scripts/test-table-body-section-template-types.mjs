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
  console.error('Invalid public Table template fixture unexpectedly compiled.');
  process.exit(1);
}

if (!diagnostics.includes("Property 'missing' does not exist on type 'FixtureRow'")) {
  console.error('Public typed cell guard row diagnostic was not produced.');
  console.error(diagnostics);
  process.exit(1);
}

// A TypeScript error can short-circuit Angular template checking. Compile
// the row-free state context independently to require both diagnostics.
const invalidLoading = compile('tsconfig.invalid-loading.json');
const loadingDiagnostics = `${invalidLoading.stdout}\n${invalidLoading.stderr}`;
if (
  invalidLoading.status === 0 ||
  !loadingDiagnostics.includes(
    "Property 'row' does not exist on type 'NeuTableStateTemplateContext'",
  )
) {
  console.error('Row-free loading context diagnostic was not produced.');
  console.error(loadingDiagnostics);
  process.exit(1);
}

console.log('Table public template typing passed (typed cell guard and row-free loading context).');
