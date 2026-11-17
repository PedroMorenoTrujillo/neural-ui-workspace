import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { optimizeUiCoreClasses } from './optimize-ui-core-classes.mjs';
import { compactTemplateResource, compactAngularTemplates } from './lib/compact-angular-template.mjs';

test('compacts layout trivia while preserving Angular control flow, binding literals and text', () => {
  const template = `
    @for (row of rows(); track row.id) {
      <button type="button" [attr.aria-label]="'Move ' + row.title"
        (click)="move(row.id)"> {{ row.title }} </button>
    }
  `;
  const result = compactTemplateResource(template);
  assert.ok(result.length < template.length);
  assert.match(result, /'Move ' \+ row.title/);
  assert.match(result, /track row.id/);
});

test('rejects changes to significant preformatted text and literal attribute values', () => {
  for (const template of [
    '<pre>first\n    second</pre>',
    '<textarea>first\n    second</textarea>',
    '<button aria-label="Two  spaces">Text</button>',
    '<span>{{ "Two  spaces" }}</span>',
  ]) assert.equal(compactTemplateResource(template), template);
});

test('retains compiler literal resources, maps and explicit whitespace-preserving components', () => {
  const code = 'const definition = { template: `<div>\n    <span>{{ title }}</span>\n</div>` };';
  const result = compactAngularTemplates(code, 'table.mjs');
  assert.ok(result.savings > 0);
  assert.match(result.code, /template: "<div> <span>\{\{ title \}\}<\/span> <\/div>"/);
  assert.ok(JSON.parse(result.map.toString()).sourcesContent.includes(code));
  assert.equal(compactAngularTemplates(code.replace('template:', 'preserveWhitespaces: true, template:'), 'table.mjs'), null);
  assert.equal(compactAngularTemplates(result.code, 'table.mjs'), null);
});


test('compacts the distributed Select template and preserves composed maps without expanding the allowlist', () => {
  const root = mkdtempSync(join(tmpdir(), 'neural-select-compact-'));
  const directory = join(root, 'fesm2022');
  mkdirSync(directory);
  const code = 'const definition = { template: `<div>\n  @if (mixed()) { <input type="checkbox" [indeterminate]="true" /> }\n</div>` };';
  const select = join(directory, 'neural-ui-core-select.mjs');
  const unrelated = join(directory, 'neural-ui-core-other.mjs');
  try {
    writeFileSync(select, code);
    writeFileSync(unrelated, code);
    writeFileSync(`${select}.map`, JSON.stringify({
      version: 3, file: 'neural-ui-core-select.mjs', sources: ['select.ts'],
      sourcesContent: [code], names: [], mappings: 'AAAA',
    }));
    optimizeUiCoreClasses(root);
    assert.notEqual(readFileSync(select, 'utf8'), code);
    assert.equal(readFileSync(unrelated, 'utf8'), code);
    assert.equal(compactAngularTemplates(readFileSync(select, 'utf8'), 'select.mjs'), null);
    const map = JSON.parse(readFileSync(`${select}.map`, 'utf8'));
    assert.ok(map.sources.some((source) => source.endsWith('select.ts')));
    assert.ok(map.sourcesContent.includes(code));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
