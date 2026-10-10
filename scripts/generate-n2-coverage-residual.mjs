import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const coverage = JSON.parse(readFileSync(join(root, 'coverage/ui-core/coverage-final.json'), 'utf8'));
const output = join(root, 'coverage/ui-core/rel-02f-residual.json');
const files = [];

function classify(path, expression, type) {
  if (/false\s*&&/.test(expression)) return 'G. IMPOSSIBLE / DEAD BY PROOF';
  if (path.endsWith('.html') || /^@if|^{{|\(click\)|\(keydown|\(input\)|\(change\)|\(drag/.test(expression))
    return 'C. TEMPLATE / DOM EVENT';
  if (/isPlatformBrowser|defaultView|ResizeObserver|MutationObserver|\bwindow\b|\bbrowser\b/.test(expression))
    return 'F. PLATFORM / BROWSER / SSR GUARD';
  if (/\.then\(|\.catch\(|await |Promise|requestAnimationFrame|setTimeout|clearTimeout|destroyed/.test(expression))
    return 'E. ASYNC CALLBACK';
  if (/^if\s*\(|\?\?|Number\.isFinite|typeof |=== null|=== undefined|!.*return/.test(expression))
    return 'D. DEFENSIVE / ERROR';
  if (/\/internal\/|\.engine\.|\.utils\./.test(path)) return 'A. PURE LOGIC / HELPER';
  if (/component|directive/.test(path)) return 'B. COMPONENT STATE LOGIC';
  return 'H. UNKNOWN';
}

function route(category) {
  if (category.startsWith('A.')) return 'Direct table-driven semantic test of the internal helper';
  if (category.startsWith('B.')) return 'Focused component state fixture or narrow typed internal adapter';
  if (category.startsWith('C.')) return 'Dispatch the real DOM event and assert the visible or emitted result';
  if (category.startsWith('D.')) return 'Exercise the guard with a valid and invalid input and assert fallback or no-op';
  if (category.startsWith('E.')) return 'Deterministic callback, cancellation, rejection or cleanup test';
  if (category.startsWith('F.')) return 'Inject or mock the environmental dependency in a stable unit test';
  if (category.startsWith('G.')) return 'Inspect proof, then remove only behavior-neutral dead source';
  return 'Inspect source and nearest test before choosing a route';
}

for (const [absolute, record] of Object.entries(coverage)) {
  const path = relative(root, absolute).replaceAll('\\', '/');
  const source = readFileSync(absolute, 'utf8').split('\n');
  const expression = (location) => {
    const line = location?.start?.line;
    return Number.isInteger(line) ? (source[line - 1] ?? '').trim() : '';
  };
  const statements = Object.entries(record.s)
    .filter(([, hits]) => hits === 0)
    .map(([id]) => ({ id, location: record.statementMap[id], expression: expression(record.statementMap[id]) }));
  const branches = Object.entries(record.b).flatMap(([id, hits]) => {
    const branch = record.branchMap[id];
    const sourceExpression = expression(branch.loc);
    const category = classify(path, sourceExpression, branch.type);
    return hits.flatMap((count, slot) => count === 0 ? [{
      id,
      slot,
      identity: `${path}:${branch.line}:${id}:${slot}`,
      line: branch.line,
      block: id,
      lcovBranch: slot,
      type: branch.type,
      expression: sourceExpression,
      sourceCondition: (source[branch.line - 1] ?? '').trim(),
      missingOutcome: branch.type === 'if' || branch.type === 'cond-expr'
        ? (slot === 0 ? 'true/consequent' : 'false/alternate')
        : `slot ${slot} of ${hits.length}`,
      siblingHits: hits,
      coveredSiblings: hits.flatMap((value, index) => value > 0 ? [{ slot: index, hits: value }] : []),
      location: branch.locations[slot],
      category,
      recommendedTestRoute: route(category),
    }] : []);
  });
  const functions = Object.entries(record.f)
    .filter(([, hits]) => hits === 0)
    .map(([id]) => ({ id, name: record.fnMap[id].name, location: record.fnMap[id].decl,
      expression: expression(record.fnMap[id].decl) }));
  const lineHits = new Map();
  for (const [id, hits] of Object.entries(record.s)) {
    const line = record.statementMap[id].start.line;
    lineHits.set(line, Math.max(lineHits.get(line) ?? 0, hits));
  }
  const lines = [...lineHits].filter(([, hits]) => hits === 0)
    .map(([line]) => ({ line, expression: (source[line - 1] ?? '').trim() }));
  if (statements.length || branches.length || functions.length || lines.length) {
    files.push({ path, statements, branches, functions, lines });
  }
}

files.sort((left, right) => right.branches.length - left.branches.length);
const totals = Object.fromEntries(['statements', 'branches', 'functions', 'lines'].map((name) =>
  [name, files.reduce((sum, file) => sum + file[name].length, 0)],
));
writeFileSync(output, `${JSON.stringify({ schemaVersion: 2, totals, files }, null, 2)}\n`);
console.log(`${output}: ${JSON.stringify(totals)}`);
