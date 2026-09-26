import { build } from 'esbuild';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDirectFesmInputs, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const tree = join(fesm, 'neural-ui-core-tree.mjs');
const cases = {
  basic: `import { NeuTreeComponent } from '${tree}'; export { NeuTreeComponent };`,
  rich: `import { NeuTreeComponent, NeuTreeNodeDirective } from '${tree}'; export { NeuTreeComponent, NeuTreeNodeDirective };`,
  rootUnused: `import { provideNeuralUI } from '${join(fesm, 'neural-ui-core.mjs')}';`,
};
const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const result = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'js' },
    bundle: true, format: 'esm', platform: 'browser', minify: true,
    write: false, metafile: true, logLevel: 'silent',
    tsconfigRaw: { compilerOptions: {} },
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', '@neural-icons/*'],
  });
  assertDirectFesmInputs(result.metafile, join(root, 'dist/neural-ui/core'), contents);
  const bytes = result.outputFiles[0].contents;
  const inputs = Object.keys(result.metafile.inputs);
  if (inputs.some((input) => /(?:^|\/)projects\/ui-core\//.test(input)))
    throw new Error('C6 package measurement resolved workspace source');
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes).length,
    treeReachable: inputs.some((input) => input.includes('neural-ui-core-tree.mjs')),
    forbiddenFacades: inputs.filter((input) => /neural-ui-core-(?:table|tree-table|virtual-list|menu)\.mjs/.test(input)),
  };
}
if (results.rootUnused.raw !== 0 || results.rootUnused.treeReachable) throw new Error('C6 root-unused retained Tree');
if (!results.basic.treeReachable || results.basic.forbiddenFacades.length) throw new Error('C6 basic retained forbidden facade');
console.log(JSON.stringify(results, null, 2));
