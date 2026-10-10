import { build } from 'esbuild';
import { performance } from 'node:perf_hooks';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const built = await build({ entryPoints: [join(root, 'projects/ui-core/virtual-list/neu-virtual-list.engine.ts')],
  bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent' });
const { projectVirtualWindow, keyToken } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].contents).toString('base64')}`
);
const quantiles = (numbers) => {
  const sorted = numbers.toSorted((a, b) => a - b);
  return { p50: sorted[Math.floor(sorted.length * .5)], p95: sorted[Math.floor(sorted.length * .95)] };
};
function measure(label, action, iterations = 200) {
  for (let index = 0; index < 20; index++) action();
  const samples = [];
  for (let index = 0; index < iterations; index++) {
    const start = performance.now(); action(); samples.push(performance.now() - start);
  }
  return [label, quantiles(samples)];
}
const results = {};
for (const count of [1000, 10000, 100000, 1000000]) {
  const options = { itemCount: count, itemSize: 40, viewportHeight: 400, overscan: 2 };
  results[count] = Object.fromEntries([
    measure('range', () => projectVirtualWindow({ ...options, scrollTop: count * 20 })),
    measure('largeJump', () => projectVirtualWindow({ ...options, scrollTop: count * 40 })),
  ]);
  if (count === 1000000) continue; // geometry-only: no million-item domain array
  const items = Array.from({ length: count }, (_, index) => ({ key: index }));
  results[count].windowProjection = measure('windowProjection', () => {
    const range = projectVirtualWindow({ ...options, scrollTop: count * 20 }).render;
    const rows = [];
    for (let index = range.start; index < range.end; index++)
      rows.push({ item: items[index], index, token: keyToken(items[index].key) });
    return rows;
  })[1];
  results[count].keyLookup = measure('keyLookup', () =>
    items.findIndex((item) => keyToken(item.key) === keyToken(count - 1)), 30)[1];
}
console.log(JSON.stringify({ unit: 'ms', environment: 'Node pure engine; not browser render', results }, null, 2));
