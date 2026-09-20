import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ngc = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ngc.cmd' : 'ngc');
const fixture = join(root, 'fixtures/n2-tree-table-contracts');
const compile = (name) =>
  spawnSync(ngc, ['-p', join(fixture, name)], { cwd: root, encoding: 'utf8' });

const valid = compile('tsconfig.valid.json');
if (valid.status !== 0) {
  console.error(valid.stdout, valid.stderr);
  process.exit(valid.status ?? 1);
}

const invalid = compile('tsconfig.invalid.json');
const diagnostics = `${invalid.stdout}\n${invalid.stderr}`.replace(
  // eslint-disable-next-line no-control-regex
  /\u001b\[[0-9;]*m/g,
  '',
);
if (invalid.status === 0) throw new Error('Invalid N2 TreeTable fixture unexpectedly compiled.');
const expected = [
  `Type 'boolean' is not assignable to type 'NeuTreeTableKey'`,
  `Type '"age"' is not assignable to type '"name"'`,
  `is not assignable to type 'NeuTreeRelation<number>'`,
  `Property 'parentKey' is missing`,
  `Type '"whatever"' is not assignable`,
  `Type '"tree"' is not assignable`,
  `Property 'code' is missing`,
  `Argument of type 'Event' is not assignable`,
  `Property 'push' does not exist on type 'readonly number[]'`,
  `Property 'lazyLoad' does not exist`,
  `Expected 1 arguments, but got 0`,
];
const missing = expected.filter((message) => !diagnostics.includes(message));
const count = (diagnostics.match(/error TS\d+:/g) ?? []).length;
if (missing.length > 0 || count < 11) {
  console.error(`Missing expected N2 TreeTable diagnostics: ${missing.join(' | ')}`);
  console.error(`Observed ${count} diagnostics.`);
  console.error(diagnostics);
  process.exit(1);
}
console.log(
  `N2 TreeTable types passed (positive consumer compiles; ${count} invalid shapes rejected).`,
);
