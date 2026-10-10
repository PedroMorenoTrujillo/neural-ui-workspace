import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), 'utf8');
const foundation = read('projects/ui-core/foundation/neu-overlay-dismiss-policy.ts');
const dialog = read('projects/ui-core/modal/neu-modal.component.ts');
const sheet = read('projects/ui-core/bottom-sheet/neu-bottom-sheet.component.ts');
const sidebar = read('projects/ui-core/sidebar/neu-sidebar.component.ts');
const calendar = read('projects/ui-core/calendar/neu-calendar.component.ts');

test('N2-022 exposes the closed close-intent contract', () => {
  assert.match(
    foundation,
    /export type NeuCloseReason = 'escape' \| 'outside' \| 'action' \| 'programmatic-command'/,
  );
  assert.match(foundation, /export interface NeuCloseRequest/);
  assert.match(foundation, /readonly reason: NeuCloseReason/);
  assert.match(foundation, /readonly originalEvent\?: Event/);
  assert.doesNotMatch(foundation, /NeuCloseReason\s*=\s*string/);
});

test('Sidebar overlay is controlled-only and URL/storage independent', () => {
  for (const contract of [
    /readonly open = input\(false\)/,
    /readonly closeRequested = output<NeuCloseRequest>/,
    /readonly opened = output<void>/,
    /readonly closed = output<void>/,
    /readonly overlayActive = computed\(\(\) => !this\.persistent\(\) && this\.open\(\)\)/,
  ])
    assert.match(sidebar, contract);
  for (const forbidden of [
    /NeuUrlStateService/,
    /@angular\/router/,
    /localStorage/,
    /sessionStorage/,
    /\burlParam\b/,
    /\bopenChange\b/,
    /\binitialOpen\b/,
    /^\s+open\([^)]*\): void/m,
    /^\s+close\([^)]*\): void/m,
    /\bmodel\s*\(/,
  ])
    assert.doesNotMatch(sidebar, forbidden);
  assert.equal((sidebar.match(/\beffect\s*\(/g) ?? []).length, 2);
});

test('Dialog and BottomSheet separate close intent from lifecycle', () => {
  for (const source of [dialog, sheet]) {
    assert.match(source, /readonly closeRequested = output<NeuCloseRequest>/);
    assert.match(source, /readonly opened = output<void>/);
    assert.match(source, /readonly closed = output<void>/);
    assert.doesNotMatch(source, /readonly hidden = output/);
  }
  assert.match(dialog, /reason === 'backdrop' \? 'outside' : reason/);
  assert.match(sheet, /requestClose\([\s\S]*reason: NeuCloseReason = 'programmatic-command'/);
});

test('Calendar has one canonical date-selection channel', () => {
  assert.match(calendar, /readonly selectedDateChange = output<Date>/);
  assert.doesNotMatch(calendar, /\bdateSelect\b/);
  const selection = calendar.slice(
    calendar.indexOf('selectDate(date: Date)'),
    calendar.indexOf('protected openDay'),
  );
  assert.equal((selection.match(/\.emit\(/g) ?? []).length, 1);
});

test('already migrated controls retain their frozen event names', () => {
  const sources = {
    select: read('projects/ui-core/select/neu-select.component.ts'),
    autocomplete: read('projects/ui-core/autocomplete/neu-autocomplete.component.ts'),
    tags: read('projects/ui-core/input-tags/neu-input-tags.component.ts'),
    tree: read('projects/ui-core/tree-select/neu-tree-select.component.ts'),
    date: read('projects/ui-core/date-input/neu-date-input.component.ts'),
  };
  for (const name of ['optionActivated', 'focusEntered', 'focusLeft', 'opened', 'closed']) {
    assert.match(sources.select, new RegExp(`\\b${name}\\b`));
    assert.match(sources.autocomplete, new RegExp(`\\b${name}\\b`));
  }
  for (const name of ['optionActivated', 'focusEntered', 'focusLeft', 'opened', 'closed'])
    assert.match(sources.tags, new RegExp(`\\b${name}\\b`));
  for (const name of ['filter', 'opened', 'closed', 'cleared'])
    assert.match(sources.tree, new RegExp(`\\b${name}\\b`));
  for (const name of ['opened', 'closed', 'cleared'])
    assert.match(sources.date, new RegExp(`\\b${name}\\b`));
});
