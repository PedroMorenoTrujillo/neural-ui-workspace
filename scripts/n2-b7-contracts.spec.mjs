import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const contract = JSON.parse(readFileSync(join(root, 'projects/ui-core/public-contract.v2.json'), 'utf8'));
const component = (name) => contract.items.find((item) => item.kind === 'component' && item.name === name);
const supported = (item, kind) => item.members.filter((member) => member.kind === kind && member.status === 'SUPPORTED');

test('B7 exposes one typed Slider with numeric bounds separate from Signal Forms metadata', () => {
  const slider = component('NeuSliderComponent');
  const inputs = supported(slider, 'input').map((member) => member.publicName);
  assert.equal(inputs.length, 22);
  assert.ok(inputs.includes('minValue'));
  assert.ok(inputs.includes('maxValue'));
  assert.ok(inputs.includes('minStepsBetweenThumbs'));
  assert.ok(inputs.includes('orientation'));
  assert.ok(!inputs.includes('min'));
  assert.ok(!inputs.includes('max'));
  assert.equal(supported(slider, 'model').length, 1);
  assert.equal(supported(slider, 'output').length, 1);
  assert.match(slider.signature, /FormValueControl<V>/);
  const valueType = contract.items.find((item) => item.entrypoint === './slider' && item.name === 'NeuSliderValue');
  assert.ok(valueType);
  assert.match(valueType.signature, /SliderValue/);
});

test('B7 Rating adds only the discrete step input', () => {
  const rating = component('NeuRatingComponent');
  const inputs = supported(rating, 'input').map((member) => member.publicName);
  assert.equal(inputs.length, 16);
  assert.ok(inputs.includes('step'));
  assert.equal(supported(rating, 'model').length, 1);
  assert.equal(supported(rating, 'output').length, 1);
});
