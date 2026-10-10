import { legacyLedger } from './n2-table-contract-manifest.mjs';
import { validateLegacyLedger } from './lib/n2-table-contracts.mjs';

const violations = validateLegacyLedger();
if (violations.length > 0) {
  console.error('N2 Table legacy ledger failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

const counts = Object.fromEntries(
  ['input', 'output', 'method'].map((kind) => [
    kind,
    legacyLedger.filter((entry) => entry.kind === kind).length,
  ]),
);
console.log(
  `N2 Table removed-legacy ledger passed (${counts.input} inputs, ${counts.output} outputs, ${counts.method} methods; every frozen member has disposition, target, reason and migration).`,
);
