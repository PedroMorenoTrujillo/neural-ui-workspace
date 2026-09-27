import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const git = existsSync('/opt/homebrew/bin/git') ? '/opt/homebrew/bin/git' : 'git';
const inventory = JSON.parse(execFileSync(git, [
  'show', '09e181859076dca0e379378814d0074dfa7f38c4:N2-REL-02-COVERAGE-INVENTORY.json',
], { cwd: root, encoding: 'utf8' }));
const quotas = [
  ['tree-table/internal/renderer/neu-tree-table-renderer.component.ts', 35],
  ['tree-table/internal/renderer/neu-tree-table-renderer.component.html', 5],
  ['table/internal/renderer/neu-table-basic-renderer.component.ts', 35],
  ['table/internal/renderer/neu-table-basic-renderer.component.html', 12],
  ['select/neu-select.component.ts', 25],
  ['date-input/neu-date-input.component.ts', 25],
  ['tree/neu-tree.component.ts', 20],
  ['color-picker/neu-color-picker.component.ts', 20],
  ['mega-menu/neu-mega-menu.component.ts', 20],
  ['kanban/neu-kanban.component.ts', 20],
  ['tree-select/neu-tree-select.component.ts', 15],
  ['uploader/neu-uploader.component.ts', 15],
];

function syntax(source) {
  const s = source.trim();
  if (/^@(?:if|for|switch|case)\b|^</.test(s) || /\([^)]*\)=/.test(s)) return 'template';
  if (/\bisPlatformBrowser\b|\bbrowser\s*===\s*null|!this\.browser/.test(s)) return 'browser-guard';
  if (/\b(?:throw|error|invalid|destroyed)\b/i.test(s)) return 'error-guard';
  if (/\bswitch\b|\bcase\b/.test(s)) return 'switch';
  if (/\?\.|\?\?/.test(s)) return 'optional-nullish';
  if (/&&|\|\|/.test(s)) return 'short-circuit';
  if (/\?[^?].*:/.test(s)) return 'ternary';
  if (/\bif\b|\belse\b/.test(s)) return 'if-else';
  return 'other';
}

function classify(row) {
  const s = row.source.trim();
  if (row.file.endsWith('select/neu-select.component.ts') &&
      [1044, 1062].includes(row.line) && /\bfalse\s*&&/.test(s)) {
    return ['G', 'Literal false short-circuits the right operand; this branch cannot be entered as written.'];
  }
  if (row.file.endsWith('tree/neu-tree.component.ts') && row.line === 118) {
    return ['G', 'virtualRange is consumed only inside the template virtualization() arm or the focusIndex options guard; its no-options arm has no valid caller.'];
  }
  if (row.file.endsWith('tree-table/internal/renderer/neu-tree-table-renderer.component.ts') && row.line === 369) {
    return ['G', 'The sort button exists only inside the column.sort template arm; delegated valid clicks cannot call onSort with an unsortable column.'];
  }
  if (row.file.endsWith('tree-table/internal/renderer/neu-tree-table-renderer.component.ts') && row.line === 475) {
    return ['G', 'Every valid commitFilter caller first requires a column.filter field; its no-filter guard cannot be entered through the public template.'];
  }
  if (row.file.endsWith('mega-menu/neu-mega-menu.component.ts') &&
      [345, 346].includes(row.line) && /rtl\s*\?/.test(s)) {
    return ['C', 'The same rtl boolean is repeated in coordinate ternaries on this line; one direction state selects all coordinates together.'];
  }
  if (/isPlatformBrowser|browser\s*===\s*null|!this\.browser/.test(s)) {
    return ['H', 'Platform guard is visible, but the uncovered branch side and source-counter identity need a browser/SSR run.'];
  }
  if (/\b(?:typeof|instanceof|Array\.isArray|Number\.isFinite|Number\.isNaN|validCivilYear|validCivilMonth|isCivilYear|isCivilMonth)\b/.test(s)) {
    return ['B', 'The source checks a runtime type or validity boundary; malformed or boundary input selects its other path.'];
  }
  if (/\b(?:destroyed|invalid|error)\b/i.test(s) && !row.file.endsWith('.html')) {
    return ['B', 'The source handles a lifecycle, error, or invalid-state boundary; individual reachability remains a follow-up test question.'];
  }
  if (row.file.endsWith('.html') || row.syntax === 'template' || /\b(?:event\.key|mode\(\)|presentation\(\)|this\.lazy\(\)|options\.mode|indicator\.type|this\.grouping\(\)|this\.isOpen\(\))/.test(s)) {
    return ['A', 'A valid rendered mode, keyboard action, or visible template state selects a distinct user-observable outcome.'];
  }
  if (/\b(?:null|undefined)\b|\?\.|\?\?/.test(s)) {
    return ['H', 'Optional-state source needs a public-state and counter-side proof before it can be called reachable or redundant.'];
  }
  if (/\b(?:if|else|switch|case)\b|\?[^?].*:/.test(s)) {
    return ['A', 'The source chooses between application states or actions; the exact opposite outcome remains a test target.'];
  }
  return ['H', 'Source snippet alone does not establish a distinct outcome or a counter-only classification.'];
}

const rows = [];
for (const [suffix, quota] of quotas) {
  const file = inventory.files.find((item) => item.file.endsWith(suffix));
  if (!file) throw new Error(`Missing inventory source: ${suffix}`);
  const candidates = file.uncoveredBranchLocations.map((branch) => ({
    file: file.file,
    line: branch.line,
    block: branch.block,
    branch: branch.branch,
    source: branch.source.trim(),
    syntax: syntax(branch.source),
  }));
  const selected = new Map();
  const add = (row) => selected.set(`${row.line}:${row.block}:${row.branch}`, row);
  const priority = candidates.filter((row) =>
    (suffix.includes('mega-menu') && [345, 346].includes(row.line)) ||
    (suffix.includes('select/neu-select') && [1044, 1062].includes(row.line)) ||
    row.syntax === 'browser-guard' || row.syntax === 'error-guard');
  for (const row of priority) if (selected.size < quota) add(row);
  for (const kind of ['template', 'ternary', 'short-circuit', 'optional-nullish', 'switch', 'if-else', 'other']) {
    const row = candidates.find((entry) => entry.syntax === kind && !selected.has(`${entry.line}:${entry.block}:${entry.branch}`));
    if (row && selected.size < quota) add(row);
  }
  const remaining = candidates.filter((row) => !selected.has(`${row.line}:${row.block}:${row.branch}`));
  while (selected.size < Math.min(quota, candidates.length) && remaining.length) {
    const index = Math.floor(remaining.length / 2);
    add(remaining.splice(index, 1)[0]);
  }
  for (const row of selected.values()) {
    const [category, reason] = classify(row);
    rows.push({ ...row, category, reason });
  }
}

const counts = Object.fromEntries('ABCDEFGH'.split('').map((category) =>
  [category, rows.filter((row) => row.category === category).length]));
const syntaxCounts = Object.fromEntries([...new Set(rows.map((row) => row.syntax))].sort().map((kind) =>
  [kind, rows.filter((row) => row.syntax === kind).length]));
const allFunctions = inventory.files.flatMap((file) => file.uncoveredFunctions.map((fn) => ({
  file: file.file,
  name: fn.name,
  line: fn.line,
})));
const sampleGroup = (items, count) => {
  if (items.length <= count) return items;
  return Array.from({ length: count }, (_, index) => items[Math.floor(index * items.length / count)]);
};
const chosenFunctions = [
  ...sampleGroup(allFunctions.filter((fn) => /_listener$|HostBindingHandler$/.test(fn.name)), 50),
  ...sampleGroup(allFunctions.filter((fn) => /^\(anonymous_\d+\)$/.test(fn.name)), 70),
  ...allFunctions.filter((fn) => !/_listener$|HostBindingHandler$|^\(anonymous_\d+\)$/.test(fn.name)),
];
const sourceLines = new Map();
const functionRows = chosenFunctions.map((fn) => {
  let lines = sourceLines.get(fn.file);
  if (!lines) {
    lines = readFileSync(join(root, fn.file), 'utf8').split('\n');
    sourceLines.set(fn.file, lines);
  }
  const source = (lines[fn.line - 1] ?? '').trim();
  let category = 'unknown';
  let reason = 'The mapped source line does not establish the callback role.';
  if (/_listener$|HostBindingHandler$/.test(fn.name)) {
    category = 'meaningful event callback';
    reason = 'Angular generated a listener for a declared template or host event; the event has a user-visible interaction path.';
  } else if (/\b(?:requestAnimationFrame|MutationObserver|ResizeObserver|addEventListener|setTimeout|setInterval)\b/.test(source)) {
    category = 'browser callback';
    reason = 'The mapped arrow is scheduled by a browser event/timing API.';
  } else if (/\b(?:throw|error|invalid|destroyed)\b/i.test(source)) {
    category = 'defensive/error callback';
    reason = 'The mapped arrow occurs on a failure, invalid-state or teardown line.';
  } else if (/=>|\b(?:function|return|const)\b/.test(source)) {
    category = 'meaningful application function';
    reason = 'The mapped arrow or named function computes or applies application state.';
  }
  return { ...fn, source, category, reason };
});
const functionCounts = Object.fromEntries([...new Set(functionRows.map((fn) => fn.category))].sort().map((category) =>
  [category, functionRows.filter((fn) => fn.category === category).length]));
const output = {
  source: 'REL-02C canonical LCOV-derived inventory at checkpoint 09e181859076dca0e379378814d0074dfa7f38c4',
  populationUncoveredBranches: inventory.total.branches.total - inventory.total.branches.covered,
  method: 'Purposive top-residual sample, including required syntax and platform/error guards; conservative source-level primary classification. Counts are sample counts, not population estimates. H is used when counter semantics are unproven.',
  sampleSize: rows.length,
  counts,
  syntaxCounts,
  rows,
  functionPopulationUncovered: allFunctions.length,
  functionSampleSize: functionRows.length,
  functionCounts,
  functionRows,
};
writeFileSync(join(root, 'N2-REL-02D-FORENSIC-SAMPLE.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`REL-02D sample: ${rows.length} branches ${JSON.stringify(counts)}; ${functionRows.length} functions ${JSON.stringify(functionCounts)}`);
