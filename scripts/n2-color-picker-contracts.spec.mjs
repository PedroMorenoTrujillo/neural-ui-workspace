import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(
  join(root, 'projects/ui-core/color-picker/neu-color-picker.component.ts'),
  'utf8',
);
const styles = readFileSync(
  join(root, 'projects/ui-core/color-picker/neu-color-picker.component.scss'),
  'utf8',
);
const utils = readFileSync(join(root, 'projects/ui-core/color-picker/color-utils.ts'), 'utf8');

test('N2-024 preserves the string Signal Forms contract and closed color modes', () => {
  assert.match(source, /readonly value = model<string>\(/);
  assert.match(source, /readonly mode = input<NeuColorMode>\('hex'\)/);
  assert.match(utils, /export type NeuColorMode = 'hex' \| 'rgb' \| 'hsl' \| 'oklch'/);
  for (const event of ['touch', 'opened', 'closed', 'valueCommitted']) {
    assert.match(source, new RegExp(`readonly ${event} = output<`));
  }
  assert.equal((source.match(/= output</g) ?? []).length, 4);
  assert.doesNotMatch(
    source,
    /ControlValueAccessor|NG_VALUE_ACCESSOR|registerOnChange|registerOnTouched|setDisabledState/,
  );
});

test('N2-024 keeps a single value owner and browser sampling private', () => {
  assert.match(source, /protected readonly _color = computed\(/);
  assert.match(source, /afterNextRender\(/);
  assert.match(source, /_sampleScreenColor\(\)/);
  assert.doesNotMatch(source, /\beffect\(/);
  assert.doesNotMatch(source, /@HostListener/);
  assert.doesNotMatch(
    source,
    /(?:readonly|public) (?:palette|customColors|eyeDropper|sampledColor) = (?:input|output|model)</,
  );
  assert.doesNotMatch(
    source,
    /@neural-ui\/core\/(?:table|tree-table)|primeng|@angular\/router|@angular\/common\/http|localStorage|sessionStorage/,
  );
});

test('N2-024 retains canonical visual tokens', () => {
  for (const token of [
    '--neu-primary',
    '--neu-border-color',
    '--neu-surface-1',
    '--neu-text-primary',
  ]) {
    assert.ok(styles.includes(token), `Missing ${token}`);
  }
  assert.doesNotMatch(styles, /--neu-color-|--neu-tone-|--neu-variant-/);
});
