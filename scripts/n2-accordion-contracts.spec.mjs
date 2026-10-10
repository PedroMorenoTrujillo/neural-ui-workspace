import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const source = readFileSync(
  join(root, 'projects/ui-core/accordion/neu-accordion.component.ts'),
  'utf8',
);
const publicApi = readFileSync(join(root, 'projects/ui-core/accordion/public_api.ts'), 'utf8');

test('N2-020 exposes the frozen controlled Accordion contract', () => {
  for (const contract of [
    /export type NeuAccordionKey = string \| number/,
    /readonly expandedKeys = input<readonly K\[\] \| undefined>/,
    /readonly initialExpandedKeys = input<readonly K\[\]>/,
    /readonly expandedKeysChange = output<readonly K\[\]>/,
    /readonly panelToggle = output<NeuAccordionPanelToggle<K>>/,
    /export class NeuAccordionBodyDirective</,
    /TemplateRef<NeuAccordionBodyContext<T>>/,
  ]) {
    assert.match(source, contract);
  }
  assert.match(publicApi, /export \* from '\.\/neu-accordion\.component'/);
});

test('N2-020 removes item-owned expansion and keeps one aggregate owner', () => {
  const itemContract = source.slice(
    source.indexOf('export interface NeuAccordionItem'),
    source.indexOf('export interface NeuAccordionHeaderContext'),
  );
  assert.doesNotMatch(itemContract, /\bexpanded\??:/);
  assert.doesNotMatch(source, /readonly (?:openKeys|activeKeys|value) = (?:input|model)/);
  assert.doesNotMatch(source, /\bmodel\s*\(/);
  assert.doesNotMatch(source, /\beffect\s*\(/);
});

test('N2-020 keeps native, inert and sanitized presentation contracts', () => {
  assert.match(source, /<button/);
  assert.match(source, /\[attr\.inert\]="!isExpanded/);
  assert.match(source, /SecurityContext\.HTML/);
  assert.doesNotMatch(source, /bypassSecurityTrustHtml/);
  assert.match(source, /ArrowDown/);
  assert.match(source, /ArrowUp/);
  assert.match(source, /Home/);
  assert.match(source, /End/);
});

test('N2-020 has no CVA, Table-family or transport dependency', () => {
  for (const forbidden of [
    /ControlValueAccessor/,
    /NG_VALUE_ACCESSOR/,
    /@neural-ui\/core\/(?:table|tree-table|table-core)/,
    /@angular\/router/,
    /@angular\/common\/http/,
    /localStorage|sessionStorage/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});
