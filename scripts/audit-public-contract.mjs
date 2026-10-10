import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  diffContracts,
  formatContractDiff,
  generateContract,
  reconcileLegacySnapshot,
  validateContract,
  validatePolicy,
} from './lib/public-contract.mjs';

const startedAt = performance.now();
const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceRoot = join(workspaceRoot, 'projects/ui-core');
const distRoot = join(workspaceRoot, 'dist/neural-ui/core');
const legacySnapshotPath = join(sourceRoot, 'public-contract.snapshot.json');
const contractPath = join(sourceRoot, 'public-contract.v2.json');
const policyPath = join(sourceRoot, 'public-contract.policy.json');
const reconciliationPath = join(sourceRoot, 'public-contract.reconciliation.json');
const update = process.argv.includes('--update');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

if (!existsSync(join(distRoot, 'package.json'))) {
  console.error('Contract audit requires a compiled package. Run npm run build first.');
  process.exit(1);
}
if (!existsSync(policyPath)) {
  console.error(
    `Contract classification policy is missing: ${relative(workspaceRoot, policyPath)}`,
  );
  process.exit(1);
}
if (!existsSync(legacySnapshotPath)) {
  console.error(
    `Historical contract snapshot is missing: ${relative(workspaceRoot, legacySnapshotPath)}`,
  );
  process.exit(1);
}

const policy = readJson(policyPath);
const contract = generateContract({ distRoot, sourceRoot, policy });
const contractViolations = validateContract(contract);
if (contractViolations.length) {
  console.error('Generated public contract is invalid:');
  for (const violation of contractViolations) console.error(`- ${violation}`);
  process.exit(1);
}
const policyViolations = validatePolicy(policy, contract);
if (policyViolations.length) {
  console.error('Public contract classification policy is invalid:');
  for (const violation of policyViolations) console.error(`- ${violation}`);
  process.exit(1);
}
const reconciliation = reconcileLegacySnapshot(readJson(legacySnapshotPath), contract);

if (update) {
  writeJson(contractPath, contract);
  writeJson(reconciliationPath, reconciliation);
  console.log(`Public declaration contract updated: ${relative(workspaceRoot, contractPath)}`);
  console.log(`Historical reconciliation updated: ${relative(workspaceRoot, reconciliationPath)}`);
} else {
  if (!existsSync(contractPath)) {
    console.error('Declaration contract is missing. Run npm run snapshot:contracts after review.');
    process.exit(1);
  }
  const expected = readJson(contractPath);
  const diff = diffContracts(expected, contract);
  if (diff.additions.length || diff.removals.length || diff.changes.length) {
    console.error(formatContractDiff(diff, workspaceRoot));
    process.exit(1);
  }
  if (!existsSync(reconciliationPath)) {
    console.error('Historical contract reconciliation is missing.');
    process.exit(1);
  }
  const expectedReconciliation = readJson(reconciliationPath);
  if (JSON.stringify(expectedReconciliation) !== JSON.stringify(reconciliation)) {
    console.error('Historical public-contract reconciliation changed.');
    process.exit(1);
  }
}

const elapsedMs = Math.round(performance.now() - startedAt);
const { summary } = contract;
console.log(
  `Public contract audit passed (${summary.entrypoints} entry points, ` +
    `${summary.exportedDeclarations} exported declarations, ${summary.bindings.total} bindings, ` +
    `${summary.publicSymbols} classified symbols, ${elapsedMs} ms).`,
);
console.log(
  `Legacy reconciliation: ${reconciliation.summary.mapped} mapped, ` +
    `${reconciliation.summary.newlyDiscovered} newly discovered, ` +
    `${reconciliation.summary.missingOldEntries} missing old, ` +
    `${reconciliation.summary.ambiguities} ambiguous.`,
);
