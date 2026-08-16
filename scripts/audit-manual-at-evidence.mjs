import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const qualityRoot = join(workspaceRoot, 'projects/ui-core/quality');
const matrix = JSON.parse(
  readFileSync(join(qualityRoot, 'entrypoint-quality-matrix.json'), 'utf8'),
);
const evidence = JSON.parse(readFileSync(join(qualityRoot, 'manual-at-evidence.json'), 'utf8'));
const entryPoints = new Set(
  matrix.entryPoints.filter((entry) => entry.name !== 'testing').map((entry) => entry.name),
);
const expectedTargets = new Set([
  'nvda',
  'narrator',
  'voiceover-macos',
  'voiceover-ios',
  'talkback',
]);
const failures = [];
const targetIds = new Set((evidence.targets ?? []).map((target) => target.id));
if (
  targetIds.size !== expectedTargets.size ||
  [...expectedTargets].some((target) => !targetIds.has(target))
) {
  failures.push('the required free assistive-technology target set is incomplete');
}
const jaws = (evidence.excludedTargets ?? []).find((target) => target.id === 'jaws');
if (jaws?.status !== 'NOT_VALIDATED_PAID' || !jaws.reason) {
  failures.push('JAWS must be explicitly recorded as NOT_VALIDATED_PAID with a reason');
}

const seen = new Set();
for (const result of evidence.results ?? []) {
  const key = `${result.entryPoint}:${result.target}`;
  if (seen.has(key)) failures.push(`${key}: duplicate result`);
  seen.add(key);
  if (!entryPoints.has(result.entryPoint)) failures.push(`${key}: unknown entry point`);
  if (!expectedTargets.has(result.target)) failures.push(`${key}: unknown target`);
  if (!['PASS', 'FAIL', 'BLOCKED'].includes(result.status)) {
    failures.push(`${key}: invalid status ${result.status}`);
  }
  for (const field of [
    'tester',
    'testedAt',
    'commit',
    'osVersion',
    'browser',
    'browserVersion',
    'assistiveTechnologyVersion',
    'notes',
  ]) {
    if (typeof result[field] !== 'string' || !result[field].trim()) {
      failures.push(`${key}: missing ${field}`);
    }
  }
}

if (failures.length) {
  console.error('Manual assistive-technology evidence is invalid:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const expectedResults = entryPoints.size * expectedTargets.size;
console.log(
  `Manual assistive-technology evidence is structurally valid (${seen.size}/${expectedResults} results recorded; JAWS NOT_VALIDATED_PAID).`,
);
