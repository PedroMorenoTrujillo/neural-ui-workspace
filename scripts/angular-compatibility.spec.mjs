import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));

async function readWorkspaceFile(relativePath) {
  return readFile(join(workspaceRoot, relativePath), 'utf8');
}

test('workspace and published package target Angular 22 only', async () => {
  const workspacePackage = JSON.parse(await readWorkspaceFile('package.json'));
  const publishedPackage = JSON.parse(await readWorkspaceFile('projects/ui-core/package.json'));
  const angularRuntimePackages = [
    '@angular/cdk',
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    '@angular/forms',
    '@angular/platform-browser',
    '@angular/router',
  ];
  const angularToolingPackages = [
    '@angular-devkit/schematics',
    '@angular/build',
    '@angular/cli',
    '@angular/compiler-cli',
    '@schematics/angular',
    'ng-packagr',
  ];
  const publishedAngularPeers = [
    '@angular-devkit/schematics',
    '@angular/cdk',
    '@angular/common',
    '@angular/core',
    '@angular/forms',
    '@angular/router',
    '@schematics/angular',
  ];

  for (const packageName of angularRuntimePackages) {
    assert.match(workspacePackage.dependencies[packageName], /^22\.1\.\d+$/, packageName);
  }
  for (const packageName of angularToolingPackages) {
    assert.match(workspacePackage.devDependencies[packageName], /^22\.1\.\d+$/, packageName);
  }
  assert.match(workspacePackage.devDependencies.typescript, /^~6\.0\.\d+$/);
  assert.equal(workspacePackage.dependencies.rxjs, '~7.8.0');
  assert.equal(workspacePackage.engines.node, '^22.22.3 || ^24.15.0 || >=26.0.0');
  assert.equal(publishedPackage.engines.node, '^22.22.3 || ^24.15.0 || >=26.0.0');

  for (const packageName of publishedAngularPeers) {
    assert.equal(
      publishedPackage.peerDependencies[packageName],
      '>=22.0.0 <23.0.0',
      packageName,
    );
  }
});

test('active Angular 22 consumers stay zoneless on the stable API', async () => {
  const activeConsumerFiles = [
    'scripts/test-ui-core-compatibility.mjs',
    'scripts/prepare-h9-browser-consumer.mjs',
    'fixtures/compatibility-consumer/src/main.ts',
    'fixtures/compatibility-consumer/src/ssr-tree-table.mjs',
    'fixtures/compatibility-consumer/src/ssr-h9-events.mjs',
  ];

  for (const relativePath of activeConsumerFiles) {
    const source = await readWorkspaceFile(relativePath);
    assert.doesNotMatch(source, /provideExperimentalZonelessChangeDetection/, relativePath);
    assert.doesNotMatch(source, /provideZoneChangeDetection/, relativePath);
    assert.doesNotMatch(source, /['"]zone\.js['"]/, relativePath);
  }

  const mainSource = await readWorkspaceFile('fixtures/compatibility-consumer/src/main.ts');
  assert.match(mainSource, /provideZonelessChangeDetection/);
});

test('Ripple imports DOCUMENT from the public Angular entrypoint', async () => {
  const source = await readWorkspaceFile('projects/ui-core/ripple/neu-ripple.directive.ts');

  assert.match(source, /import\s*\{[^}]*\bDOCUMENT\b[^}]*\}\s*from\s*'@angular\/common';/s);
  assert.doesNotMatch(
    source,
    /import\s*\{[^}]*\bDOCUMENT\b[^}]*\}\s*from\s*'@angular\/core';/s,
  );
});
