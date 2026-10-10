import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const coverageRoot = join(root, 'coverage/ui-core');
const summary = JSON.parse(readFileSync(join(coverageRoot, 'coverage-summary.json'), 'utf8'));
const lcov = readFileSync(join(coverageRoot, 'lcov.info'), 'utf8');
const threshold = 95.01;

function ranges(lines) {
  const sorted = [...new Set(lines)].sort((a, b) => a - b);
  const result = [];
  for (const line of sorted) {
    const last = result.at(-1);
    if (last && line === last[1] + 1) last[1] = line;
    else result.push([line, line]);
  }
  return result;
}

const byFile = new Map();
for (const record of lcov.split('end_of_record')) {
  const lines = record.split('\n');
  const sourceFile = lines.find((line) => line.startsWith('SF:'))?.slice(3);
  if (!sourceFile) continue;
  const source = readFileSync(join(root, sourceFile), 'utf8').split('\n');
  const functions = new Map();
  const uncoveredLines = [];
  const uncoveredBranches = [];
  for (const line of lines) {
    if (line.startsWith('FN:')) {
      const body = line.slice(3), comma = body.indexOf(',');
      const location = Number(body.slice(0, comma));
      const name = body.slice(comma + 1);
      functions.set(name, { name, line: location, hits: null });
    } else if (line.startsWith('FNDA:')) {
      const body = line.slice(5), comma = body.indexOf(',');
      const name = body.slice(comma + 1);
      const entry = functions.get(name);
      if (entry) entry.hits = Number(body.slice(0, comma));
    } else if (line.startsWith('DA:')) {
      const [location, hits] = line.slice(3).split(',').map(Number);
      if (hits === 0) uncoveredLines.push(location);
    } else if (line.startsWith('BRDA:')) {
      const [location, block, branch, taken] = line.slice(5).split(',');
      if (taken === '-' || Number(taken) === 0) {
        const at = Number(location);
        uncoveredBranches.push({ line: at, block: Number(block), branch: Number(branch), source: source[at - 1]?.trim() ?? '' });
      }
    }
  }
  const coverage = Object.entries(summary).find(([name]) => name.endsWith(`/${sourceFile}`))?.[1];
  if (!coverage) throw new Error(`Coverage summary missing ${sourceFile}`);
  const metrics = Object.fromEntries(['statements', 'branches', 'functions', 'lines'].map((metric) => [
    metric,
    {
      ...coverage[metric],
      uncovered: coverage[metric].total - coverage[metric].covered,
    },
  ]));
  const row = {
    file: sourceFile,
    metrics,
    uncoveredLineRanges: ranges(uncoveredLines),
    uncoveredBranchLocations: uncoveredBranches,
    uncoveredFunctions: [...functions.values()].filter((entry) => entry.hits === 0).sort((a, b) => a.line - b.line),
  };
  row.absoluteGap = Object.values(metrics).reduce((sum, metric) => sum + metric.uncovered, 0);
  byFile.set(sourceFile, row);
}

if (byFile.size !== Object.keys(summary).length - 1) {
  throw new Error(`LCOV/summary file count mismatch: ${byFile.size} / ${Object.keys(summary).length - 1}`);
}
const files = [...byFile.values()].filter((row) => row.absoluteGap > 0)
  .sort((a, b) => b.absoluteGap - a.absoluteGap || a.file.localeCompare(b.file));
const artifact = {
  schemaVersion: 1,
  source: 'fresh canonical ng test ui-core --watch=false --coverage V8 run',
  threshold,
  total: summary.total,
  coveredProductionFiles: byFile.size,
  filesWithGaps: files.length,
  ordering: 'absoluteGap = uncovered statements + branches + functions + lines; an ordering proxy, not additive executable code',
  files,
};
writeFileSync(join(root, 'N2-REL-02-COVERAGE-INVENTORY.json'), `${JSON.stringify(artifact, null, 2)}\n`);

const compact = (items) => items.length ? items.join(', ') : '—';
const rangeText = (row) => compact(row.uncoveredLineRanges.map(([start, end]) => start === end ? `${start}` : `${start}-${end}`));
const branchText = (row) => compact(row.uncoveredBranchLocations.map(({ line, block, branch }) => `${line}:${block}.${branch}`));
const functionText = (row) => compact(row.uncoveredFunctions.map(({ line, name }) => `${name}@${line}`));
const md = [
  '# N2 REL-02 — Fresh canonical coverage inventory',
  '',
  `Threshold: ${threshold}% for statements, branches, functions and lines. Files with gaps: ${files.length}/${byFile.size}.`,
  '',
  'Sorted by absolute uncovered counts across the four metrics. Counts overlap and are used only for prioritization.',
  '',
  '| Rank | Production file | S% (miss) | B% (miss) | F% (miss) | L% (miss) | Absolute gap |',
  '|---:|---|---:|---:|---:|---:|---:|',
  ...files.map((row, index) => `| ${index + 1} | \`${row.file}\` | ${row.metrics.statements.pct} (${row.metrics.statements.uncovered}) | ${row.metrics.branches.pct} (${row.metrics.branches.uncovered}) | ${row.metrics.functions.pct} (${row.metrics.functions.uncovered}) | ${row.metrics.lines.pct} (${row.metrics.lines.uncovered}) | ${row.absoluteGap} |`),
  '',
  '## Uncovered locations by file',
  '',
  ...files.flatMap((row) => [
    `### ${row.file}`,
    '',
    `- Uncovered line ranges: ${rangeText(row)}`,
    `- Uncovered branch locations (line:block.branch): ${branchText(row)}`,
    `- Uncovered functions (name@line): ${functionText(row)}`,
    '',
  ]),
];
writeFileSync(join(root, 'N2-REL-02-COVERAGE-INVENTORY.md'), `${md.join('\n').trimEnd()}\n`);
console.log(`REL-02 inventory: ${files.length}/${byFile.size} production files with gaps; top ${files.slice(0, 5).map((row) => row.file).join(', ')}`);
