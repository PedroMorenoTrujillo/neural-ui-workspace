import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const bundle = await build({
  entryPoints: [join(root, 'projects/ui-core/input-mask/neu-input-mask.engine.ts')],
  bundle: true,
  platform: 'neutral',
  format: 'esm',
  write: false,
});
const source = Buffer.from(bundle.outputFiles[0].contents).toString('base64');
const { compileMask, insertIntoMask, deleteFromMask, reconcileInput } = await import(
  `data:text/javascript;base64,${source}`
);
const mask = compileMask(Array.from({ length: 32 }, () => '99/').join(''));
let value = reconcileInput(mask, '1234567890'.repeat(7), 70).value;
const samples = [];
for (let index = 0; index < 500; index++) {
  const start = performance.now();
  const position = Math.min(value.length, (index * 7) % (value.length + 1));
  value = insertIntoMask(mask, value, String(index % 10), position).value;
  if (index % 3 === 0) value = deleteFromMask(mask, value, position, position, 'backward').value;
  samples.push(performance.now() - start);
}
samples.sort((left, right) => left - right);
const percentile = (fraction) => samples[Math.floor((samples.length - 1) * fraction)];
console.log(JSON.stringify({
  scenario: '96 editable slots / 500 middle edits, Node pure engine, no browser claim',
  p50Ms: percentile(0.5),
  p95Ms: percentile(0.95),
  finalLength: value.length,
}, null, 2));
