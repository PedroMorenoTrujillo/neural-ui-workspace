import assert from 'node:assert/strict';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { validateTargetContracts } from './lib/n2-table-contracts.mjs';

const root = 'projects/ui-core/table/next';

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

test('keeps the runtime candidate isolated behind one public facade', () => {
  const currentPublicApi = readFileSync('projects/ui-core/table/public_api.ts', 'utf8');
  const candidatePublicApi = readFileSync(`${root}/public/public-api.ts`, 'utf8');
  assert.doesNotMatch(currentPublicApi, /table\/next|neu-table\.component-contract/);
  assert.match(candidatePublicApi, /neu-table\.component-contract/);
  assert.match(candidatePublicApi, /neu-table-template-contracts/);
  assert.match(candidatePublicApi, /neu-table\.types/);
  assert.doesNotMatch(candidatePublicApi, /internal/);
  assert.deepEqual(validateTargetContracts(), []);
});

test('uses computed projections with the frozen two-effect viewport/request ledger', () => {
  const product = files(root)
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  assert.equal((product.match(/\beffect\s*\(/g) ?? []).length, 2);
  assert.doesNotMatch(product, /\bmodel\s*(?:<[^>]+>)?\s*\(/);
  assert.doesNotMatch(product, /HostListener/);
  assert.equal((product.match(/addEventListener\('scroll'/g) ?? []).length, 1);
  assert.equal((product.match(/removeEventListener\('scroll'/g) ?? []).length, 1);
  assert.equal((product.match(/new ResizeObserverConstructor/g) ?? []).length, 1);
  assert.equal((product.match(/requestAnimationFrame\(/g) ?? []).length, 1);
  assert.equal((product.match(/cancelAnimationFrame\(/g) ?? []).length, 1);
  assert.match(product, /\bcomputed\s*\(/);
});

test('keeps legacy runtimes absent and confines Signal Forms to the active editor chunk', () => {
  const internalFiles = files(`${root}/internal`);
  const internal = internalFiles
    .filter((path) => !path.endsWith('neu-table-active-editor.component.ts'))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  for (const forbidden of [
    /table-core/,
    /\.\.\/\.\.\/neu-table/,
    /@angular\/forms/,
    /@angular\/router/,
    /@angular\/cdk/,
    /sort\.controller/,
    /filter\.engine/,
    /selection\.controller/,
    /virtual-scroll/,
    /editing\.controller/,
    /export\.controller/,
  ]) {
    assert.doesNotMatch(internal, forbidden);
  }
  const activeEditor = readFileSync(
    `${root}/internal/features/editing/neu-table-active-editor.component.ts`,
    'utf8',
  );
  assert.match(activeEditor, /@angular\/forms\/signals/);
  assert.doesNotMatch(activeEditor, /ControlValueAccessor|NG_VALUE_ACCESSOR|@angular\/forms['"]/);
});

test('contains no symlink in the N2-011H candidate', () => {
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      assert.equal(lstatSync(path).isSymbolicLink(), false, `unexpected symlink: ${path}`);
      if (entry.isDirectory()) visit(path);
    }
  };
  visit(root);
});
