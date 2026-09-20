import { collectCurrentTableMembers, validateLegacyLedger } from './lib/n2-table-contracts.mjs';

const violations = validateLegacyLedger();
if (violations.length > 0) {
  console.error('N2 Table legacy ledger failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

const current = collectCurrentTableMembers();
console.log(
  `N2 Table legacy ledger passed (${current.input.length} inputs, ${current.output.length} outputs, ${current.method.length} methods; every member has disposition, target, reason and migration).`,
);
