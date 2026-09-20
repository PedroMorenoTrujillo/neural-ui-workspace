import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = 'projects/ui-core/tree-table/next';
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
  '@angular/forms',
  '@angular/common/http',
  'primeng',
  '/table/neu-table',
  '/table-core/',
  '/tree-table/neu-tree-table',
];
const violations = [];
let effects = 0;
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  effects += (source.match(/\beffect\s*\(/g) ?? []).length;
  assert.doesNotMatch(
    source,
    /__(?:treeLevel|parent|path|expanded|selected|partialSelected|loading|leaf|childrenLoaded|virtualIndex|treeMeta)\b/,
  );
  for (const match of source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)) {
    for (const forbidden of forbiddenImports) {
      if (match[1].includes(forbidden)) violations.push(`${file}: ${match[1]}`);
    }
  }
}
assert.equal(effects, 0, 'N2-015B must have zero product effects.');
assert.deepEqual(violations, []);

const result = await build({
  entryPoints: [`${root}/public/public-api.ts`],
  bundle: true,
  external: ['@angular/core', '@angular/common'],
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
assert.match(graph, /internal\/neu-exact-key/);
assert.match(graph, /internal\/neu-field-value-resolver/);
console.log(
  `N2 TreeTable boundary audit passed (${files.length} files, 0 effects, neutral internals only).`,
);
