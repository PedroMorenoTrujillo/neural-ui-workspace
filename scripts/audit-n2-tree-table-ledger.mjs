import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('N2-TREETABLE2-LEGACY-LEDGER.md', 'utf8');
const sections = [
  ['## 42 inputs legacy delegados', '## 21 outputs legacy delegados', 42],
  ['## 21 outputs legacy delegados', '## Ocho métodos Table 1.x invocados por TreeTable 1.x', 21],
  [
    '## Ocho métodos Table 1.x invocados por TreeTable 1.x',
    '## TreeTable 1.x full public surface baseline',
    8,
  ],
];
for (const [start, end, expected] of sections) {
  const section = source.slice(source.indexOf(start), source.indexOf(end));
  const rows = section.split('\n').filter((line) => /^\|\s*\d+\s*\|/.test(line));
  assert.equal(rows.length, expected, `${start} must contain ${expected} rows`);
  assert.equal(new Set(rows.map((row) => row.split('|')[2]?.trim())).size, expected);
  assert.doesNotMatch(section, /\bDEPRECATE\b/);
  for (const row of rows) {
    assert.match(row, /\|\s*(?:KEEP|CHANGE|MERGE|RENAME|REMOVE|INTERNALIZE|OUT OF SCOPE)\s*\|/);
  }
}
console.log('N2 TreeTable legacy ledger passed (42 inputs, 21 outputs, 8 methods; no DEPRECATE).');
