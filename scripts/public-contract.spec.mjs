import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  diffContracts,
  generateContract,
  reconcileLegacySnapshot,
  validateContract,
  validatePolicy,
} from './lib/public-contract.mjs';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureRoot = join(workspaceRoot, 'fixtures/public-contract');
const policy = {
  schemaVersion: 1,
  overrides: {},
  compatibility: {},
  frameworkMembers: [],
  publicImperativeMembers: {
    SyntheticCompoundComponent: ['publicMethod'],
  },
};

function fixtureContract() {
  return generateContract({
    distRoot: join(fixtureRoot, 'dist'),
    sourceRoot: join(fixtureRoot, 'source'),
    policy,
  });
}

test('declaration inventory sees multiline input, output, model, and aliases', () => {
  const source = readFileSync(join(fixtureRoot, 'synthetic.source.ts'), 'utf8');
  assert.match(source, /input<string>\(\s*\n/);
  assert.match(source, /output<string>\(\{\s*\n/);
  assert.match(source, /model<boolean>\(\s*\n/);

  const contract = fixtureContract();
  assert.deepEqual(validateContract(contract), []);
  assert.deepEqual(validatePolicy(policy, contract), []);
  assert.deepEqual(contract.summary.bindings, { input: 3, output: 2, model: 1, total: 6 });
  const alias = contract.bindings.find((binding) => binding.propertyName === 'internalAlias');
  assert.equal(alias.publicName, 'publicAlias');
  assert.equal(alias.required, true);
  const outputAlias = contract.bindings.find((binding) => binding.propertyName === 'aliasedOutput');
  assert.equal(outputAlias.publicName, 'publicOutput');
  const modelBinding = contract.bindings.find((binding) => binding.kind === 'model');
  assert.equal(modelBinding.changePublicName, 'multilineModelChange');
});

test('compound declarations cover components, template directives, services, types, functions, and tokens', () => {
  const contract = fixtureContract();
  const kinds = Object.fromEntries(contract.items.map((item) => [item.name, item.kind]));
  assert.equal(kinds.SyntheticCompoundComponent, 'component');
  assert.equal(kinds.SyntheticTemplateDirective, 'directive');
  assert.equal(kinds.SyntheticService, 'service');
  assert.equal(kinds.SyntheticOptions, 'interface');
  assert.equal(kinds.SyntheticValue, 'type');
  assert.equal(kinds.syntheticFunction, 'function');
  assert.equal(kinds.SYNTHETIC_TOKEN, 'token');
  assert.equal(kinds.SyntheticServiceAlias, 'service');
  assert.equal(contract.designTokens[0], '--neu-synthetic-token');
});

test('public properties and methods are classified independently from deprecated and internal API', () => {
  const contract = fixtureContract();
  const component = contract.items.find((item) => item.name === 'SyntheticCompoundComponent');
  const byName = Object.fromEntries(component.members.map((member) => [member.name, member]));
  assert.equal(byName.publicProperty.status, 'REVIEW');
  assert.equal(byName.publicMethod.status, 'SUPPORTED');
  assert.equal(byName.legacyMethod.status, 'DEPRECATED');
  assert.equal(byName.internalMechanic.status, 'INTERNAL/UNSUPPORTED');
  assert.equal(
    contract.items.find((item) => item.name === 'legacySyntheticFunction').status,
    'DEPRECATED',
  );
  assert.equal(
    contract.items.find((item) => item.name === 'INTERNAL_SYNTHETIC_TOKEN').status,
    'INTERNAL/UNSUPPORTED',
  );
});

test('contract diff detects additions, removals, and signature changes', () => {
  const expected = fixtureContract();
  const actual = structuredClone(expected);
  const component = actual.items.find((item) => item.name === 'SyntheticCompoundComponent');
  component.members.find((member) => member.name === 'publicMethod').signature =
    'publicMethod(value: boolean): string;';
  component.members = component.members.filter((member) => member.name !== 'publicProperty');
  actual.items.push({
    id: '.#AddedType',
    entrypoint: '.',
    name: 'AddedType',
    kind: 'type',
    status: 'SUPPORTED',
    signature: 'type AddedType = string;',
    members: [],
  });
  const diff = diffContracts(expected, actual);
  assert.deepEqual(diff.additions, ['.#AddedType']);
  assert.deepEqual(diff.removals, ['.#SyntheticCompoundComponent.property:publicProperty']);
  assert.deepEqual(
    diff.changes.map((change) => change.id),
    ['.#SyntheticCompoundComponent.method:publicMethod'],
  );
});

test('legacy reconciliation maps recorded bindings and identifies declaration-only discoveries', () => {
  const contract = fixtureContract();
  const legacy = {
    schemaVersion: 1,
    components: {
      'synthetic.component.ts': {
        selector: 'neu-synthetic',
        inputs: ['multilineInput'],
        outputs: ['multilineOutput'],
      },
    },
  };
  const reconciliation = reconcileLegacySnapshot(legacy, contract);
  assert.equal(reconciliation.summary.mapped, 2);
  assert.equal(reconciliation.summary.missingOldEntries, 0);
  assert.ok(
    reconciliation.newlyDiscovered.some(
      (item) => item.id === '.#SyntheticCompoundComponent.model:multilineModel',
    ),
  );
});
