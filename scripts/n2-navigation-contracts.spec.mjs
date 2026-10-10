import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), 'utf8');
const tabs = read('projects/ui-core/tabs/neu-tabs.component.ts');
const tabsApi = read('projects/ui-core/tabs/public_api.ts');
const panel = read('projects/ui-core/panel/neu-panel.component.ts');
const sidebar = read('projects/ui-core/sidebar/neu-sidebar.component.ts');

test('N2-021 exposes the frozen controlled navigation contracts', () => {
  for (const contract of [
    /export type NeuTabKey = string \| number/,
    /readonly activeId = input<K \| null \| undefined>/,
    /readonly initialActiveId = input<K \| null>/,
    /readonly activeIdChange = output<K \| null>/,
    /export interface NeuTabLabelContext</,
    /TemplateRef<NeuTabLabelContext<T>>/,
  ]) assert.match(tabs, contract);
  for (const source of [panel, sidebar]) {
    assert.match(source, /readonly collapsed = input<boolean \| undefined>/);
    assert.match(source, /readonly initialCollapsed = input\(false\)/);
    assert.match(source, /readonly collapsedChange = output<boolean>/);
  }
  assert.match(tabsApi, /NeuTabsComponent.*from '\.\/neu-tabs\.component'/);
  assert.match(tabsApi, /NeuTabLabelContext.*from '\.\/neu-tabs\.component'/);
});

test('N2-021 removes implicit Tabs navigation ownership and state mirrors', () => {
  for (const forbidden of [
    /\btabParam\b/,
    /\btabChange\b/,
    /NeuUrlStateService/,
    /@angular\/router/,
    /\beffect\s*\(/,
    /ResizeObserver/,
    /requestAnimationFrame/,
    /\bmodel\s*\(/,
  ]) assert.doesNotMatch(tabs, forbidden);
  assert.doesNotMatch(panel, /\beffect\s*\(/);
});

test('N2-021 separates roving focus from selection and keeps stable instance IDs', () => {
  assert.match(tabs, /private readonly uid = inject\(NeuIdGenerator\)\.getId\('neu-tabs-'\)/);
  assert.match(tabs, /private readonly focusedId = signal<K \| null>/);
  assert.match(tabs, /event\.key === 'Home'/);
  assert.match(tabs, /event\.key === 'End'/);
  assert.match(tabs, /getAttribute\('dir'\).*=== 'rtl'/s);
  const keyboard = tabs.slice(
    tabs.lastIndexOf('protected onTabKeydown('),
    tabs.indexOf('private moveFocus('),
  );
  assert.doesNotMatch(keyboard, /activeIdChange\.emit|selectTab\(/);
});

test('N2-021 keeps Fieldset unchanged and limits Sidebar effects to overlay lifecycle', () => {
  assert.match(panel, /export class NeuFieldsetComponent/);
  assert.equal((sidebar.match(/\beffect\s*\(/g) ?? []).length, 2);
  assert.match(sidebar, /private pendingFocusTimer/);
  assert.match(sidebar, /private ensureCollapseControlMode/);
});

test('N2-021 has no forms, CVA, Table-family or transport dependency in the new state owners', () => {
  for (const source of [tabs, panel]) {
    for (const forbidden of [
      /ControlValueAccessor/,
      /NG_VALUE_ACCESSOR/,
      /@angular\/forms/,
      /@angular\/common\/http/,
      /@neural-ui\/core\/(?:table|tree-table|table-core)/,
      /localStorage|sessionStorage/,
    ]) assert.doesNotMatch(source, forbidden);
  }
});
