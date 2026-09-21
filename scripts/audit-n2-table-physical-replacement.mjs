import assert from 'node:assert/strict';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import {
  legacyLedger as tableLegacyLedger,
  targetInputs as tableInputs,
  targetMethods as tableMethods,
  targetOutputs as tableOutputs,
} from './n2-table-contract-manifest.mjs';
import { validateTargetContracts } from './lib/n2-table-contracts.mjs';

const tableRoot = 'projects/ui-core/table';
const treeTableRoot = 'projects/ui-core/tree-table';
const runtimeFiles = [];
const symlinks = [];

function walk(root) {
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      symlinks.push(path);
      continue;
    }
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    if (!/\.spec\.ts$/.test(path) && /\.(?:ts|html|scss|json)$/.test(path)) {
      runtimeFiles.push(path);
    }
  }
}

function classMembers(path, className) {
  const source = readFileSync(path, 'utf8');
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const declaration = file.statements.find(
    (statement) => ts.isClassDeclaration(statement) && statement.name?.text === className,
  );
  assert.ok(declaration && ts.isClassDeclaration(declaration), `${className} must exist`);
  return new Set(
    declaration.members
      .map((member) => (member.name && ts.isIdentifier(member.name) ? member.name.text : undefined))
      .filter(Boolean),
  );
}

assert.equal(existsSync('projects/ui-core/table-core'), false, 'TableCore source must be absent');
assert.equal(existsSync(join(tableRoot, 'next')), false, 'Table next path must be absent');
assert.equal(existsSync(join(treeTableRoot, 'next')), false, 'TreeTable next path must be absent');
assert.equal(existsSync(join(tableRoot, 'neu-table.component.ts')), false, 'legacy Table facade must be absent');
assert.equal(
  existsSync(join(treeTableRoot, 'neu-tree-table.component.ts')),
  false,
  'legacy TreeTable facade must be absent',
);

walk(tableRoot);
walk(treeTableRoot);
assert.deepEqual(symlinks, [], `runtime symlinks found: ${symlinks.join(', ')}`);
assert.deepEqual(validateTargetContracts(), []);

const runtimeSource = runtimeFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
for (const token of [
  '@neural-ui/core/table-core',
  'NeuTableCoreComponent',
  'neu-table-core',
  'table/next',
  'tree-table/next',
]) {
  assert.equal(runtimeSource.includes(token), false, `forbidden runtime token: ${token}`);
}
for (const token of ['@angular/router', '@angular/common/http', 'localStorage', 'sessionStorage', 'primeng']) {
  assert.equal(runtimeSource.includes(token), false, `forbidden facade dependency: ${token}`);
}

const tableMembers = classMembers(
  join(tableRoot, 'public/neu-table.component-contract.ts'),
  'NeuTableComponent',
);
assert.equal(tableInputs.every(({ name }) => tableMembers.has(name)), true);
assert.equal(tableOutputs.every(({ name }) => tableMembers.has(name)), true);
assert.equal(tableMethods.every(({ name }) => tableMembers.has(name)), true);
for (const { name, disposition } of tableLegacyLedger) {
  if (disposition === 'REMOVE') {
    assert.equal(tableMembers.has(name), false, `removed Table member survived: ${name}`);
  }
}

const treeMembers = classMembers(
  join(treeTableRoot, 'public/neu-tree-table.component-contract.ts'),
  'NeuTreeTableComponent',
);
const treeLedger = readFileSync('N2-TREETABLE2-LEGACY-LEDGER.md', 'utf8')
  .split('\n')
  .filter((line) => /^\|\s*\d+\s*\|/.test(line))
  .map((line) => line.split('|').map((cell) => cell.trim()))
  .filter((cells) => cells.includes('REMOVE'))
  .map((cells) => cells[2]?.replaceAll('`', '').replace(/\(\)$/, ''))
  .filter(Boolean);
for (const name of treeLedger) {
  assert.equal(treeMembers.has(name), false, `removed TreeTable member survived: ${name}`);
}

const selectorSource = runtimeFiles
  .filter((path) => path.endsWith('.ts'))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');
assert.equal((selectorSource.match(/selector:\s*['"]neu-table['"]/g) ?? []).length, 1);
assert.equal((selectorSource.match(/selector:\s*['"]neu-tree-table['"]/g) ?? []).length, 1);

const effectCount = (root) =>
  runtimeFiles
    .filter((path) => path.startsWith(root) && path.endsWith('.ts'))
    .reduce(
      (total, path) => total + (readFileSync(path, 'utf8').match(/\beffect\s*\(/g) ?? []).length,
      0,
    );
assert.equal(effectCount(tableRoot), 2, 'NeuTable must retain exactly two product effects');
assert.equal(effectCount(treeTableRoot), 4, 'NeuTreeTable must retain exactly four product effects');

const packagePath = 'dist/neural-ui/core/package.json';
if (existsSync(packagePath)) {
  const manifest = JSON.parse(readFileSync(packagePath, 'utf8'));
  assert.ok(manifest.exports['./table']);
  assert.ok(manifest.exports['./tree-table']);
  assert.equal(manifest.exports['./table-core'], undefined);
  for (const name of Object.keys(manifest.exports)) {
    assert.doesNotMatch(name, /(?:next|candidate)/);
  }
}

console.log(
  `N2-011K physical replacement audit passed (${runtimeFiles.length} runtime files, two independent final facades, 2/4 effects, TableCore/legacy/next absent, zero symlinks).`,
);
