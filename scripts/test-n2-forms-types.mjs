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
const fixtureRoot = join(workspaceRoot, 'fixtures', 'n2-forms-typing');

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
  console.error('Invalid N2 Forms type fixture unexpectedly compiled.');
  process.exit(1);
}

for (const expected of [
  "Argument of type 'null' is not assignable to parameter of type 'string'",
  "Argument of type 'number' is not assignable to parameter of type 'string'",
  "Argument of type 'null' is not assignable to parameter of type 'boolean'",
  "Argument of type 'number' is not assignable to parameter of type 'boolean'",
  "Argument of type 'string' is not assignable to parameter of type 'boolean'",
  "Argument of type 'undefined' is not assignable to parameter of type 'number | null'",
  "Argument of type 'null' is not assignable to parameter of type 'number'",
]) {
  if (!diagnostics.includes(expected)) {
    console.error(`Missing expected N2 Forms diagnostic: ${expected}`);
    console.error(diagnostics);
    process.exit(1);
  }
}

for (const sourceName of [
  'textarea',
  'password',
  'mask',
  'otp',
  'switchControl',
  'radio',
  'numberInput',
  'knob',
  'dateInput',
  'timeInput',
  'dateTimeInput',
  'multipleInput',
  'rangeInput',
  'selectSingle',
  'selectMultiple',
  'autocompleteStrict',
  'autocompleteFreeText',
  'cascadeSelect',
  'listboxSingle',
  'listboxMultiple',
  'toggleSingle',
  'toggleMultiple',
  'stringTags',
  'mappedTags',
  'inlineText',
  'inlineNumber',
  'colorPicker',
  'richTextEditor',
  'uploader',
]) {
  if (!diagnostics.includes(sourceName)) {
    console.error(`Missing invalid-value type coverage for ${sourceName}.`);
    console.error(diagnostics);
    process.exit(1);
  }
}

if ((diagnostics.match(/TS2345/g) ?? []).length < 54) {
  console.error('Expected at least 54 explicit invalid-value assignment diagnostics.');
  console.error(diagnostics);
  process.exit(1);
}

console.log(
  'N2 Forms types passed (21 Signal Forms controls accepted; specialized value contracts are enforced).',
);
