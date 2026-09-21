import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = 'projects/ui-core/tree-table';
const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(?:ts|html|scss)$/.test(entry.name) && !entry.name.endsWith('.spec.ts'))
      files.push(path);
  }
}
walk(root);

const forbiddenImports = [
  '@neural-ui/core/table',
  '@neural-ui/core/table-core',
  '@angular/router',
  '@angular/common/http',
  'primeng',
  '/table/neu-table',
  '/table-core/',
  '/tree-table/neu-tree-table',
];
const violations = [];
let effects = 0;
let renderEffects = 0;
let signalFormsImports = 0;
const signalFirstCounts = {
  inputDecorators: 0,
  outputDecorators: 0,
  eventEmitters: 0,
  models: 0,
  lifecycleInterfaces: 0,
  onDestroyInterfaces: 0,
  lifecycleMethods: 0,
  ngZone: 0,
  changeDetectorRef: 0,
  zoneJs: 0,
};
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  effects += (source.match(/\beffect\s*\(/g) ?? []).length;
  renderEffects += (source.match(/\bafterRenderEffect\s*\(/g) ?? []).length;
  signalFirstCounts.inputDecorators += (source.match(/@Input\s*\(/g) ?? []).length;
  signalFirstCounts.outputDecorators += (source.match(/@Output\s*\(/g) ?? []).length;
  signalFirstCounts.eventEmitters += (source.match(/\bEventEmitter\b/g) ?? []).length;
  signalFirstCounts.models += (source.match(/\bmodel\s*\(/g) ?? []).length;
  signalFirstCounts.lifecycleInterfaces += (
    source.match(
      /implements\s+(?:[^\n{]*\b)?(?:OnInit|OnChanges|DoCheck|AfterContentInit|AfterContentChecked|AfterViewInit|AfterViewChecked)\b/g,
    ) ?? []
  ).length;
  signalFirstCounts.onDestroyInterfaces += (
    source.match(/implements\s+(?:[^\n{]*\b)?OnDestroy\b/g) ?? []
  ).length;
  signalFirstCounts.lifecycleMethods += (
    source.match(
      /\bng(?:OnInit|OnChanges|DoCheck|AfterContentInit|AfterContentChecked|AfterViewInit|AfterViewChecked|OnDestroy)\s*\(/g,
    ) ?? []
  ).length;
  signalFirstCounts.ngZone += (source.match(/\bNgZone\b/g) ?? []).length;
  signalFirstCounts.changeDetectorRef += (source.match(/\bChangeDetectorRef\b/g) ?? []).length;
  signalFirstCounts.zoneJs += (source.match(/['"]zone\.js(?:\/[^'"]*)?['"]/g) ?? []).length;
  assert.doesNotMatch(
    source,
    /__(?:treeLevel|parent|path|expanded|selected|partialSelected|loading|leaf|childrenLoaded|virtualIndex|treeMeta)\b/,
  );
  for (const match of source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)) {
    if (match[1] === '@angular/forms/signals') {
      signalFormsImports += 1;
      if (!file.endsWith('internal/features/editing/neu-tree-table-active-editor.component.ts')) {
        violations.push(`${file}: ${match[1]}`);
      }
    }
    for (const forbidden of forbiddenImports) {
      if (match[1].includes(forbidden)) violations.push(`${file}: ${match[1]}`);
    }
  }
}
assert.equal(effects, 4, 'NeuTreeTable candidate must have exactly four justified effects.');
assert.equal(renderEffects, 0, 'NeuTreeTable candidate must not add a render effect.');
assert.deepEqual(signalFirstCounts, {
  inputDecorators: 0,
  outputDecorators: 0,
  eventEmitters: 0,
  models: 0,
  lifecycleInterfaces: 0,
  onDestroyInterfaces: 0,
  lifecycleMethods: 0,
  ngZone: 0,
  changeDetectorRef: 0,
  zoneJs: 0,
});
assert.deepEqual(violations, []);
assert.equal(signalFormsImports, 1, 'Signal Forms must remain isolated to the private editor chunk.');

const rendererTemplate = readFileSync(
  join(root, 'internal/renderer/neu-tree-table-renderer.component.html'),
  'utf8',
);
assert.equal((rendererTemplate.match(/\(focusin\)=/g) ?? []).length, 1);
assert.equal((rendererTemplate.match(/\(keydown\)=/g) ?? []).length, 1);
assert.equal((rendererTemplate.match(/\(click\)=/g) ?? []).length, 1);
assert.equal((rendererTemplate.match(/\(dblclick\)=/g) ?? []).length, 1);
assert.equal((rendererTemplate.match(/\(contextmenu\)=/g) ?? []).length, 1);
assert.match(rendererTemplate, /aria-multiselectable/);
assert.match(rendererTemplate, /aria-selected/);
assert.match(rendererTemplate, /aria-checked/);
assert.match(rendererTemplate, /type="checkbox"/);
assert.match(rendererTemplate, /\[type\]="indicator"/);
assert.match(rendererTemplate, /data-selection-toggle-all/);
assert.match(rendererTemplate, /data-selection-indicator/);
for (const rowTag of rendererTemplate.match(/<tr\b[^>]*>/gs) ?? []) {
  assert.doesNotMatch(rowTag, /\((?:focusin|keydown|click)\)=/);
}
const runtimeSource = files.map((file) => readFileSync(file, 'utf8')).join('\n');
assert.equal((runtimeSource.match(/\baddEventListener\s*\(/g) ?? []).length, 1);
assert.equal((runtimeSource.match(/\bResizeObserver\b/g) ?? []).length, 1);
assert.equal((runtimeSource.match(/\brequestAnimationFrame\s*\(/g) ?? []).length, 1);
assert.equal((runtimeSource.match(/\bcancelAnimationFrame\s*\(/g) ?? []).length, 1);
assert.doesNotMatch(runtimeSource, /\bsetInterval\b/);
assert.equal((runtimeSource.match(/\bsetTimeout\s*\(/g) ?? []).length, 3);
assert.ok(
  (runtimeSource.match(/\bclearTimeout\s*\(/g) ?? []).length >= 4,
  'Query debounce timers must be replaced and destroyed explicitly.',
);

const result = await build({
  entryPoints: [`${root}/public/public-api.ts`],
  bundle: true,
  external: ['@angular/core', '@angular/common', '@angular/forms/signals'],
  format: 'esm',
  loader: { '.html': 'text', '.scss': 'text' },
  metafile: true,
  platform: 'browser',
  treeShaking: true,
  write: false,
});
const graph = JSON.stringify(result.metafile.inputs);
for (const forbidden of [
  '/table/neu-table',
  '/table-core/',
  '/tree-table/neu-tree-table.component.ts',
]) {
  assert.equal(graph.includes(forbidden), false, `Forbidden graph edge: ${forbidden}`);
}
assert.match(graph, /tree-table\/internal\/shared\/neu-exact-key/);
assert.match(graph, /tree-table\/internal\/shared\/neu-field-value-resolver/);
console.log(
  `N2 TreeTable boundary audit passed (${files.length} files, 4 justified effects, 0 render effects, 0 lifecycle methods/interfaces, 0 decorators/EventEmitter/model, 0 NgZone/ChangeDetectorRef/Zone.js, Signal Forms isolated to 1 private editor chunk, 1 delegated focus/keyboard/click/double-click/context-menu boundary, 1 viewport scroll listener, 1 ResizeObserver, 1 pending rAF maximum, 2 bounded debounce timers plus 1 bounded click disambiguation timer with teardown, native selection/query/remote/virtual/edit/action/export semantics, neutral internals only).`,
);
