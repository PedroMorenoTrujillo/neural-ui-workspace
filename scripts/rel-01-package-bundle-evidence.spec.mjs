import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  assertPackageOnlyInputs,
  measurePackageImport,
  packageExportTarget,
  verifyUnusedPackageExport,
} from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(root, 'dist/neural-ui/core');

test('a real package export resolves before tree-shaking and has a used control', async () => {
  const proof = await verifyUnusedPackageExport(packageRoot, '@neural-ui/core', 'provideNeuralUI');
  assert.equal(proof.unused.size.raw, 0);
  assert.ok(proof.unused.packageInputs.includes('fesm2022/neural-ui-core.mjs'));
  assert.ok(proof.used.size.raw > 0);
  assert.equal(proof.invalidExportRejected, true);
});

test('a secondary export resolves through its compiled package FESM', async () => {
  const proof = await verifyUnusedPackageExport(packageRoot, '@neural-ui/core/tree', 'NeuTreeComponent');
  assert.equal(proof.unused.size.raw, 0);
  assert.ok(proof.unused.packageInputs.includes('fesm2022/neural-ui-core-tree.mjs'));
  assert.ok(proof.used.packageInputs.includes('fesm2022/neural-ui-core-drag-drop.mjs'));
  assert.ok(proof.used.size.raw > 0);
});

test('a non-exported symbol cannot pass by being erased as an unused TypeScript import', async () => {
  await assert.rejects(
    measurePackageImport({
      packageRoot,
      specifier: '@neural-ui/core',
      source: "import {NeuTreeComponent} from '@neural-ui/core';",
    }),
    /No matching export/,
  );
});

test('an absent package subpath cannot produce an empty green bundle', () => {
  assert.throws(
    () => packageExportTarget(packageRoot, '@neural-ui/core/rel-01-missing'),
    /Missing JavaScript package export/,
  );
});

test('workspace source in a package metafile fails the package-only assertion', () => {
  const target = packageExportTarget(packageRoot, '@neural-ui/core/tree');
  assert.throws(
    () => assertPackageOnlyInputs({ inputs: {
      'dist/neural-ui/core/fesm2022/neural-ui-core-tree.mjs': {},
      'projects/ui-core/tree/neu-tree.component.ts': {},
    } }, packageRoot, target),
    /Workspace source leaked/,
  );
});
