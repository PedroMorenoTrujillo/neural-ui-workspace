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
const fixtureRoot = join(workspaceRoot, 'fixtures', 'n2-table-contracts');

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
const diagnostics = `${invalid.stdout}\n${invalid.stderr}`.replace(
  // Angular's compiler emits ANSI even when captured by a child process.
  // eslint-disable-next-line no-control-regex
  /\u001b\[[0-9;]*m/g,
  '',
);
if (invalid.status === 0) {
  console.error('Invalid N2 Table contract fixture unexpectedly compiled.');
  process.exit(1);
}

const expectedDiagnostics = [
  `Type '"age"' is not assignable to type '"name"'`,
  `Type '"ascending"' is not assignable to type 'NeuSortDirection'`,
  `Type '"xor"' is not assignable to type 'NeuFilterOperator'`,
  `Property 'rule' is missing`,
  `'sortField' does not exist in type 'NeuTableQuery<"name">'`,
  `Property 'push' does not exist on type 'readonly NeuSortEntry<"name">[]'`,
  `Cannot assign to 'page' because it is a read-only property`,
  `Property 'scope' is missing`,
  `'keys' does not exist in type`,
  `Type '"lazy"' is not assignable to type 'NeuTableDataRequestReason'`,
  `'length' does not exist in type 'NeuTableRange'`,
  `Property 'itemSize' is missing`,
  `Property 'goToPage' does not exist`,
  `Argument of type 'Event' is not assignable to parameter of type 'NeuTableQuery<"name">'`,
];

const missing = expectedDiagnostics.filter((message) => !diagnostics.includes(message));
const diagnosticCount = (diagnostics.match(/error TS\d+:/g) ?? []).length;
if (missing.length > 0 || diagnosticCount < 16) {
  console.error(`Missing expected N2 Table diagnostics: ${missing.join(' | ')}`);
  console.error(`Observed ${diagnosticCount} diagnostics.`);
  console.error(diagnostics);
  process.exit(1);
}

console.log(
  `N2 Table types passed (positive T/K/F consumers compile; ${diagnosticCount} invalid contract shapes are rejected).`,
);
