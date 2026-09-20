import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { build } from 'esbuild';
import ts from 'typescript';
import {
  controlledSlices,
  tableCoreTarget,
  targetDirectives,
  targetInputs,
  targetMethods,
  targetOutputs,
  targetTypes,
} from './n2-table-contract-manifest.mjs';
import { validateLegacyLedger, validateTargetContracts } from './lib/n2-table-contracts.mjs';

test('freezes the exact 82-symbol target and 24/14/4 member surface', () => {
  assert.equal(targetTypes.length, 66);
  assert.equal(targetDirectives.length, 15);
  assert.equal(targetInputs.length, 24);
  assert.equal(targetOutputs.length, 14);
  assert.equal(targetMethods.length, 4);
  assert.deepEqual(validateTargetContracts(), []);
});

test('classifies every output once and keeps the six controlled owners unique', () => {
  assert.deepEqual(
    Object.fromEntries(
      ['PROPOSAL', 'DOMAIN EVENT', 'LIFECYCLE'].map((category) => [
        category,
        targetOutputs.filter((output) => output.category === category).length,
      ]),
    ),
    { PROPOSAL: 6, 'DOMAIN EVENT': 7, LIFECYCLE: 1 },
  );
  assert.equal(new Set(targetOutputs.map((output) => output.name)).size, 14);
  assert.equal(controlledSlices.length, 6);
  assert.equal(targetOutputs.filter((output) => output.name === 'dataRequest').length, 1);
});

test('covers every current facade member in the executable removal ledger', () => {
  assert.deepEqual(validateLegacyLedger(), []);
});

test('keeps TableCore physical code while marking it absent from the public target', () => {
  assert.equal(tableCoreTarget.publicTarget, 'REMOVE');
  assert.equal(tableCoreTarget.physicalRemovalPhase, 'N2-011K');
  assert.match(
    readFileSync('projects/ui-core/table-core/public_api.ts', 'utf8'),
    /NeuTableCore|neu-table-core/,
  );
});

test('does not resolve the isolated candidate as a consumer package subpath', () => {
  const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, '.');
  const resolved = ts.resolveModuleName(
    '@neural-ui/core/table/next/public',
    'fixtures/n2-table-contracts/invalid-package-path.ts',
    parsed.options,
    ts.sys,
  );
  assert.equal(resolved.resolvedModule, undefined);
});

test('keeps the candidate product source free of direct browser-global dependencies', async () => {
  const result = await build({
    entryPoints: ['projects/ui-core/table/next/public/public-api.ts'],
    bundle: true,
    external: ['@angular/core', '@angular/common'],
    format: 'esm',
    platform: 'node',
    write: false,
    treeShaking: true,
  });
  const source = Buffer.concat(result.outputFiles.map((file) => file.contents)).toString('utf8');
  assert.doesNotMatch(source, /window|document|ResizeObserver|localStorage|sessionStorage/);
  assert.match(source, /NeuTableComponent/);
  assert.match(source, /NeuTableHeaderDirective/);
});
