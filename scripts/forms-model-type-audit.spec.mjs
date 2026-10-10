import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditFormModels } from './forms-model-type-audit.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = join(root, 'fixtures/n2-forms-audit/model-types.ts');

test('accepts concrete, nullable and bounded generic closed model types', () => {
  const models = new Map(auditFormModels(fixture).map((result) => [result.className, result]));
  for (const name of ['NumberModel', 'StringModel', 'NullableModel', 'BoundedRangeModel']) {
    assert.equal(models.get(name)?.ok, true, name);
    assert.equal(models.get(name)?.formValueControl, true, name);
  }
});

test('rejects any, unknown, unconstrained and nested unsafe generic models', () => {
  const models = new Map(auditFormModels(fixture).map((result) => [result.className, result]));
  for (const name of [
    'AnyModel', 'UnconstrainedModel', 'AnyConstraintModel',
    'UnknownConstraintModel', 'NestedAnyConstraintModel', 'BroadObjectConstraintModel',
  ]) {
    assert.equal(models.get(name)?.ok, false, name);
  }
});

test('accepts the actual B7 Slider bounded model via its resolved alias', () => {
  const file = join(root, 'projects/ui-core/slider/neu-slider.component.ts');
  const slider = auditFormModels(file).find((result) => result.formValueControl);
  assert.equal(slider?.className, 'NeuSliderComponent');
  assert.equal(slider?.ok, true);
});
