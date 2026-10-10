import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const git = existsSync('/opt/homebrew/bin/git') ? '/opt/homebrew/bin/git' : 'git';
const inventory = JSON.parse(execFileSync(git, [
  'show', '09e181859076dca0e379378814d0074dfa7f38c4:N2-REL-02-COVERAGE-INVENTORY.json',
], { cwd: root, encoding: 'utf8' }));
const plans = [
  {
    suffix: 'date-input/neu-date-input.component.ts',
    lines: [213, 252, 883, 884, 885, 896, 904, 905, 906, 935, 947, 968],
    state: 'Render month/year picker modes, use previous/next and Home/End/Page keys, then activate a period.',
    assertion: 'Visible period grid, active period, and committed civil month/year change once.',
  },
  {
    suffix: 'select/neu-select.component.ts',
    lines: [210, 287, 293, 350, 361, 420, 921, 923, 1026, 1067, 1180],
    state: 'Open projected clear/filter/group/loader states, then keyboard-navigate a lazy filtered list.',
    assertion: 'Projected DOM and active option/filtered request reflect the selected state without extra selection.',
  },
  {
    suffix: 'table/internal/renderer/neu-table-basic-renderer.component.ts',
    lines: [461, 462, 468, 533, 534, 603, 760, 764, 767],
    state: 'Render alternate sort direction/removal, explicit filter commit, and summary/page-jump pagination.',
    assertion: 'Sort ARIA, committed query/filter and page summary show the accepted state.',
  },
  {
    suffix: 'tree-table/internal/renderer/neu-tree-table-renderer.component.ts',
    lines: [338, 384, 410, 444, 463, 482],
    state: 'Use rendered sortable/filterable header with explicit filter draft and accepted query.',
    assertion: 'Visible filter draft and exactly one accepted query proposal differ from applied state.',
  },
  {
    suffix: 'tree/neu-tree.component.ts',
    lines: [120, 197, 202, 238],
    state: 'Render virtualized tree with nondefault buffer and mixed/unchecked checkbox state.',
    assertion: 'Visible node window and checkbox ARIA state match the user-visible tree model.',
  },
];

const baselineSiblings = JSON.parse(readFileSync(join(root, 'N2-REL-02D-BASELINE-SIBLINGS.json'), 'utf8'));
const branchHits = new Map(Object.entries(baselineSiblings.branchHits));

const targets = [];
for (const plan of plans) {
  const file = inventory.files.find((entry) => entry.file.endsWith(plan.suffix));
  if (!file) throw new Error(`Missing file ${plan.suffix}`);
  for (const slot of file.uncoveredBranchLocations.filter((entry) => plan.lines.includes(entry.line))) {
    const key = `${file.file}:${slot.line}:${slot.block}`;
    const siblings = [...branchHits.entries()]
      .filter(([identity]) => identity.startsWith(`${key}:`))
      .map(([identity, hits]) => ({ branch: Number(identity.slice(key.length + 1)), hits }))
      .sort((left, right) => left.branch - right.branch);
    targets.push({
      file: file.file,
      line: slot.line,
      block: slot.block,
      branch: slot.branch,
      condition: slot.source.trim(),
      currentCoveredSides: siblings.filter((entry) => entry.hits > 0),
      uncoveredSide: { branch: slot.branch, hits: 0 },
      state: plan.state,
      assertion: plan.assertion,
    });
  }
}
if (targets.length !== 50) throw new Error(`Expected 50 target slots, found ${targets.length}`);
const output = {
  baseline: 'checkpoint 09e181859076dca0e379378814d0074dfa7f38c4 canonical coverage',
  selection: '50 explicit uncovered LCOV line/block/branch identities from the top five residual clusters, recorded before test edits',
  targetCount: targets.length,
  targets,
};
writeFileSync(join(root, 'N2-REL-02D-EXACT-TARGETS.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`REL-02D exact-target baseline: ${targets.length} uncovered slots; ${targets.filter((target) => target.currentCoveredSides.length === 0).length} with no covered sibling in their block`);
