import { build } from 'esbuild';
import { performance } from 'node:perf_hooks';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'projects/ui-core/command-palette/neu-command-palette.engine.ts');
const bundled = await build({
  entryPoints: [source], bundle: true, platform: 'node', format: 'esm',
  write: false, minify: true,
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`;
const { prepareCommands, searchCommands, groupCommands, nextEnabledId } = await import(moduleUrl);

function measure(run, count = 80) {
  const samples = [];
  for (let index = 0; index < count; index += 1) {
    const start = performance.now();
    run();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return {
    p50Ms: Number(samples[Math.floor(samples.length * 0.50)].toFixed(3)),
    p95Ms: Number(samples[Math.floor(samples.length * 0.95)].toFixed(3)),
    samples: count,
  };
}

const results = {};
for (const size of [100, 1000]) {
  const commands = Object.freeze(Array.from({ length: size }, (_, index) => Object.freeze({
    id: `command-${index}`,
    kind: 'action',
    label: `Command ${index} configuración`,
    description: `Description ${index}`,
    keywords: Object.freeze([`keyword-${index}`]),
    group: `Group ${index % 10}`,
  })));
  const prepared = prepareCommands(commands);
  const matched = searchCommands(prepared, 'configuracion');
  results[size] = {
    prepare: measure(() => prepareCommands(commands)),
    queryUpdate: measure(() => searchCommands(prepared, 'configuracion')),
    grouped: measure(() => groupCommands(matched)),
    arrows100: measure(() => {
      let id = 'command-0';
      for (let index = 0; index < 100; index += 1) id = nextEnabledId(matched, id, 1);
      if (!id) throw new Error('Arrow sequence lost highlight');
    }, 30),
    matchedCount: matched.length,
    groupCount: groupCommands(matched).length,
  };
}
console.log(JSON.stringify(results, null, 2));
