import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const read = p => readFileSync(new URL('../projects/ui-core/' + p, import.meta.url), 'utf8');
test('Tabs and TabPanel hosts participate in responsive block layout', () => {
  assert.match(read('tabs/neu-tabs.component.scss'), /neu-tabs,\s*neu-tab-panel\s*\{\s*display: block;\s*min-inline-size: 0/);
});
test('flush removes panel spacing without affecting nested tabs', () => {
  assert.match(read('tabs/neu-tabs.component.scss'), /\.neu-tabs--flush > \.neu-tabs__panels > neu-tab-panel > \.neu-tab-panel\s*\{\s*padding-top: 0;/);
});
test('toolbar width includes padding and nowrap scrolls locally', () => {
  const css = read('toolbar/neu-toolbar.component.scss');
  assert.match(css, /box-sizing: border-box/);
  assert.match(css, /&--nowrap\s*\{\s*overflow-x: auto/);
  assert.match(css, /max-inline-size: 100%/);
});
test('brand toolbar uses paired surface and foreground tokens', () => {
  const css = read('toolbar/neu-toolbar.component.scss');
  assert.match(css, /--neu-primary-solid-fg/);
  assert.match(css, /--soft\.neu-toolbar--brand\s*\{[^}]*color: var\(--neu-text\)/);
});
test('breadcrumb theme follows tokens rather than hardcoded dark colors', () => {
  const css = read('breadcrumb/neu-breadcrumb.component.scss');
  assert.doesNotMatch(css, /#f2f7fb|#c9d1d9/);
  assert.match(css, /overflow-wrap: anywhere/);
});
test('fieldset and panel content can shrink below intrinsic width', () => {
  const css = read('panel/neu-panel.component.scss');
  assert.match(css, /\.neu-panel__body,\s*\.neu-fieldset\s*\{[^}]*min-inline-size: 0/);
  assert.match(css, /\.neu-panel__header\s*\{[^}]*flex-wrap: wrap/);
});
