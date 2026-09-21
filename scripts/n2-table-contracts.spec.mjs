import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { build } from 'esbuild';
import ts from 'typescript';
import {
  controlledSlices,
  tableCoreTarget,
  targetDirectives,
  targetFilterRules,
  targetInputs,
  targetMethods,
  targetOutputs,
  targetTypes,
} from './n2-table-contract-manifest.mjs';
import { validateLegacyLedger, validateTargetContracts } from './lib/n2-table-contracts.mjs';

test('freezes the exact 82-symbol target and 24/14/4 member surface', () => {
  assert.equal(targetTypes.length, 66);
  assert.equal(targetFilterRules.length, 17);
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

test('keeps the removed legacy facade fully classified in the executable ledger', () => {
  assert.deepEqual(validateLegacyLedger(), []);
});

test('physically removes TableCore at the frozen N2-011K boundary', () => {
  assert.equal(tableCoreTarget.publicTarget, 'REMOVE');
  assert.equal(tableCoreTarget.physicalRemovalPhase, 'N2-011K');
  assert.equal(existsSync('projects/ui-core/table-core'), false);
});

test('does not resolve internal source folders as consumer package subpaths', () => {
  const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, '.');
  const resolved = ts.resolveModuleName(
    '@neural-ui/core/table/public',
    'fixtures/n2-table-contracts/invalid-package-path.ts',
    parsed.options,
    ts.sys,
  );
  assert.equal(resolved.resolvedModule, undefined);
});

test('keeps browser integration platform-guarded and free of ambient global ownership', async () => {
  const result = await build({
    entryPoints: ['projects/ui-core/table/public/public-api.ts'],
    bundle: true,
    external: ['@angular/core', '@angular/common', '@angular/forms', '@angular/forms/*'],
    format: 'esm',
    platform: 'node',
    write: false,
    treeShaking: true,
  });
  const source = Buffer.concat(result.outputFiles.map((file) => file.contents)).toString('utf8');
  assert.doesNotMatch(source, /\b(?:window|document|globalThis|localStorage|sessionStorage)\b/);
  assert.match(source, /isPlatformBrowser/);
  assert.match(source, /ownerDocument/);
  assert.match(source, /NeuTableComponent/);
  assert.match(source, /NeuTableHeaderDirective/);
});
