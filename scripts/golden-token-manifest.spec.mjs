import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const manifest = JSON.parse(readFileSync(new URL('../projects/ui-core/token-manifest.json', import.meta.url), 'utf8'));
const token = name => {
  const entry = manifest.tokens.find(item => item.token === name);
  assert.ok(entry, name);
  return entry;
};

test('manifest distinguishes declarations from productive CSS and runtime readers', () => {
  for (const entry of manifest.tokens) {
    assert.deepEqual(entry.consumedIn, [...new Set([...entry.cssConsumedIn, ...entry.typescriptConsumedIn])].sort());
    for (const file of entry.cssConsumedIn) {
      const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
      assert.ok(new RegExp('var\\(\\s*' + entry.token + '(?=[,\\s)])').test(source), `${entry.token}: CSS read in ${file}`);
    }
    for (const file of entry.typescriptConsumedIn) {
      const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
      assert.ok(source.includes(`getPropertyValue('${entry.token}')`) || source.includes(`getPropertyValue("${entry.token}")`));
    }
  }
});

test('restored Table hooks have productive renderer consumers, not just root declarations', () => {
  for (const name of ['header-height', 'max-height', 'sticky-offset']) {
    const entry = token('--neu-table-' + name);
    assert.ok(entry.declaredIn.some(file => file.endsWith('_tokens.scss')));
    assert.ok(entry.cssConsumedIn.some(file => file.endsWith('neu-table-basic-renderer.component.scss')));
  }
});

test('Input and TreeTable hooks have component ownership and local fallbacks', () => {
  for (const name of ['background', 'border', 'focus-border', 'focus-ring']) {
    assert.equal(token('--neu-input-' + name).owner, 'input');
  }
  for (const name of ['cell-block', 'cell-inline', 'selected-background']) {
    const entry = token('--neu-tree-table-' + name);
    assert.equal(entry.owner, 'tree-table');
    assert.equal(entry.defaultSource, 'component-fallback');
    assert.ok(entry.cssConsumedIn.some(file => file.includes('tree-table/internal/renderer')));
    assert.equal(entry.cssConsumedIn.some(file => file.includes('/table/')), false);
  }
});
