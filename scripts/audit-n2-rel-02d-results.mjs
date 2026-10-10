import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (name) => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const git = existsSync('/opt/homebrew/bin/git') ? '/opt/homebrew/bin/git' : 'git';
const baseline = JSON.parse(execFileSync(git, [
  'show', '09e181859076dca0e379378814d0074dfa7f38c4:N2-REL-02-COVERAGE-INVENTORY.json',
], { cwd: root, encoding: 'utf8' }));
const current = read('N2-REL-02-COVERAGE-INVENTORY.json');
const manifest = read('N2-REL-02D-EXACT-TARGETS.json');
const key = ({ file, line, block, branch }) => `${file}:${line}:${block}:${branch}`;
const targetKeys = new Set(manifest.targets.map(key));
const baselineMissing = new Set(baseline.files.flatMap(({ file, uncoveredBranchLocations }) =>
  uncoveredBranchLocations.map((slot) => key({ file, ...slot }))));
const currentMissing = new Set(current.files.flatMap(({ file, uncoveredBranchLocations }) =>
  uncoveredBranchLocations.map((slot) => key({ file, ...slot }))));

const finalSlots = new Map();
let file;
for (const record of readFileSync(new URL('coverage/ui-core/lcov.info', root), 'utf8').split('\n')) {
  if (record.startsWith('SF:')) file = record.slice(3);
  if (!record.startsWith('BRDA:')) continue;
  const [line, block, branch, hits] = record.slice(5).split(',');
  finalSlots.set(key({ file, line: Number(line), block: Number(block), branch: Number(branch) }),
    hits === '-' ? 0 : Number(hits));
}

const targeted = manifest.targets.map((target) => ({
  ...target,
  finalHits: finalSlots.get(key(target)) ?? null,
  result: !finalSlots.has(key(target)) ? 'identity-disappeared' :
    finalSlots.get(key(target)) > 0 ? 'hit' : 'uncovered',
}));
const unexpectedlyHit = [...baselineMissing].filter((slot) => !targetKeys.has(slot) && (finalSlots.get(slot) ?? 0) > 0);
const disappeared = [...baselineMissing].filter((slot) => !finalSlots.has(slot));
const newlyUncovered = [...currentMissing].filter((slot) => !baselineMissing.has(slot));
const baselineByFile = new Map(baseline.files.map((entry) => [entry.file, entry]));
const currentByFile = new Map(current.files.map((entry) => [entry.file, entry]));
const files = [...new Set(manifest.targets.map(({ file }) => file))].map((file) => {
  const before = baselineByFile.get(file)?.metrics;
  const after = currentByFile.get(file)?.metrics;
  const targets = targeted.filter((target) => target.file === file);
  return { file, targetCount: targets.length, targetHits: targets.filter((target) => target.result === 'hit').length,
    before: Object.fromEntries(['statements', 'branches', 'functions', 'lines'].map((metric) =>
      [metric, before?.[metric] && { covered: before[metric].covered, total: before[metric].total }])),
    after: Object.fromEntries(['statements', 'branches', 'functions', 'lines'].map((metric) =>
      [metric, after?.[metric] && { covered: after[metric].covered, total: after[metric].total }])) };
});
const output = {
  baseline: manifest.baseline,
  final: 'fresh canonical ng test ui-core --watch=false --coverage after six REL-02D scenarios',
  targetCount: targeted.length,
  targetHits: targeted.filter((target) => target.result === 'hit').length,
  targetUncovered: targeted.filter((target) => target.result === 'uncovered').length,
  targetIdentityDisappeared: targeted.filter((target) => target.result === 'identity-disappeared').length,
  unexpectedlyHitCount: unexpectedlyHit.length,
  newlyUncoveredCount: newlyUncovered.length,
  disappearedBaselineSlotCount: disappeared.length,
  unexpectedlyHit,
  newlyUncovered,
  disappeared,
  before: baseline.total,
  after: current.total,
  files,
  targeted,
};
writeFileSync(new URL('N2-REL-02D-TARGET-RESULT.json', root), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ targetHits: output.targetHits, targetCount: output.targetCount,
  unexpectedlyHitCount: output.unexpectedlyHitCount,
  newlyUncoveredCount: output.newlyUncoveredCount,
  disappearedBaselineSlotCount: output.disappearedBaselineSlotCount,
  files: files.map(({ file, targetHits, targetCount }) => ({ file, targetHits, targetCount })) }));
