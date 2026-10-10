import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const engineSource = readFileSync(join(root, 'projects/ui-core/pick-list/neu-ordered-list.engine.ts'), 'utf8');
const compiled = await transform(engineSource, { loader: 'ts', format: 'esm', minify: false });
const engine = await import(`data:text/javascript;base64,${Buffer.from(compiled.code).toString('base64')}`);

const keyOf = (item) => item.id;
const disabled = (item) => !!item.disabled;
const order = Array.from({ length: 100 }, (_, index) => ({ id: `order-${index}` }));
const orderVisible = order.filter((_, index) => index % 2 === 0);
const source = Array.from({ length: 100 }, (_, index) => ({ id: `source-${index}` }));
const target = Array.from({ length: 100 }, (_, index) => ({ id: `target-${index}` }));
const targetVisible = target.filter((_, index) => index % 2 === 0);

function sample(label, operation, iterations = 1000) {
  const times = [];
  for (let index = 0; index < iterations + 100; index++) {
    const start = performance.now();
    operation();
    if (index >= 100) times.push(performance.now() - start);
  }
  times.sort((left, right) => left - right);
  return {
    label,
    iterations,
    p50Ms: Number(times[Math.floor(iterations * 0.5)].toFixed(4)),
    p95Ms: Number(times[Math.floor(iterations * 0.95)].toFixed(4)),
  };
}

const results = [
  sample('OrderList 100 filtered visible-slot reorder', () =>
    engine.reorderVisible(order, orderVisible, 'order-98', 0, keyOf, disabled)),
  sample('OrderList 100 filtered selected-to-top', () =>
    engine.moveSelectedVisible(order, orderVisible, ['order-98'], 'top', keyOf, disabled)),
  sample('PickList 100+100 duplicate validation', () =>
    engine.findOrderedDuplicate([['source', source], ['target', target]], keyOf)),
  sample('PickList 100+100 filtered anchor lookup', () =>
    engine.visibleAnchorIndex(target, targetVisible, 20, keyOf)),
  sample('PickList 100+100 selected transfer', () =>
    engine.transferSelected(source, target, ['source-5', 'source-50'], keyOf, disabled)),
];
console.log(JSON.stringify(results, null, 2));
