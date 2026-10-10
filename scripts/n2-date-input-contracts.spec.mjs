import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(root, 'projects/ui-core/date-input/neu-date-input.component.ts'), 'utf8');
const values = readFileSync(join(root, 'projects/ui-core/date-input/neu-date-value.ts'), 'utf8');
const period = readFileSync(join(root, 'projects/ui-core/date-input/neu-date-period.ts'), 'utf8');
const publicApi = readFileSync(join(root, 'projects/ui-core/date-input/public_api.ts'), 'utf8');

test('N2-025 freezes seven value modes and independent presentation', () => {
  for (const mode of ['date', 'time', 'datetime', 'multiple', 'range', 'month', 'year']) {
    assert.match(values, new RegExp(`'${mode}'`));
  }
  assert.match(values, /export type NeuDatePresentation = 'overlay' \| 'inline'/);
  assert.match(values, /readonly month: CivilMonth \| null/);
  assert.match(values, /readonly year: CivilYear \| null/);
  assert.match(source, /readonly presentation = input<NeuDatePresentation>\('overlay'\)/);
  assert.match(source, /readonly showWeekNumbers = input<boolean>\(false\)/);
  assert.match(publicApi, /export \* from '\.\/neu-date-value'/);
  assert.doesNotMatch(values, /'week'|'quarter'|'period-month'|'period-year'/);
  assert.doesNotMatch(source, /touchUI|fullscreenPicker|disabledMonths|disabledYears/);
});

test('N2-025 has one Signal Forms owner, no CVA or synchronization effect', () => {
  assert.match(source, /readonly value = model<V>\(/);
  assert.equal((source.match(/= model</g) ?? []).length, 1);
  assert.doesNotMatch(source, /ControlValueAccessor|NG_VALUE_ACCESSOR|registerOnChange|registerOnTouched/);
  assert.doesNotMatch(source, /\beffect\(/);
  assert.match(source, /\[ngTemplateOutlet\]="pickerSurface"/);
  assert.match(source, /presentation\(\) === 'overlay' && isOpen\(\)/);
  assert.match(source, /presentation\(\) === 'inline'/);
});

test('N2-025 period math is civil, private and does not expand day restrictions', () => {
  assert.doesNotMatch(period, /\bnew Date\b|Date\.UTC|toISOString|toLocaleString/);
  assert.doesNotMatch(period, /disabledDates|disabledDays/);
  assert.match(period, /isoWeekNumber/);
  assert.match(period, /compareCivilMonth/);
  assert.match(period, /compareCivilYear/);
  assert.doesNotMatch(publicApi, /neu-date-period/);
});
