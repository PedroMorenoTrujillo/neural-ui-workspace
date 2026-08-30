import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceRoot = join(workspaceRoot, 'projects', 'ui-core');

async function readSource(relativePath) {
  return readFile(join(sourceRoot, relativePath), 'utf8');
}

function secondaryIfConditions(source) {
  const conditions = [];
  const marker = '@else if';
  let cursor = 0;

  while ((cursor = source.indexOf(marker, cursor)) !== -1) {
    const start = source.indexOf('(', cursor + marker.length);
    let depth = 0;
    let end = start;
    for (; end < source.length; end += 1) {
      if (source[end] === '(') depth += 1;
      if (source[end] === ')' && --depth === 0) break;
    }
    conditions.push(source.slice(start + 1, end));
    cursor = end + 1;
  }

  return conditions;
}

test('Angular 19-compatible control-flow aliases stay on primary @if blocks', async () => {
  const affectedTemplates = [
    'multiselect/neu-multiselect.component.ts',
    'table/neu-table.component.ts',
    'tree-table/neu-tree-table.component.ts',
  ];

  for (const relativePath of affectedTemplates) {
    const source = await readSource(relativePath);
    const aliasedConditions = secondaryIfConditions(source).filter((condition) =>
      /;\s*as\s+[A-Za-z_$][\w$]*\s*$/.test(condition),
    );
    assert.deepEqual(aliasedConditions, [], relativePath);
  }
});

test('Ripple uses the cross-version public DOCUMENT token', async () => {
  const source = await readSource('ripple/neu-ripple.directive.ts');

  assert.match(source, /import\s*\{[^}]*\bDOCUMENT\b[^}]*\}\s*from\s*'@angular\/common';/s);
  assert.doesNotMatch(source, /import\s*\{[^}]*\bDOCUMENT\b[^}]*\}\s*from\s*'@angular\/core';/s);
});
