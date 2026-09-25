import { build } from 'esbuild';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const tree = join(fesm, 'neural-ui-core-tree.mjs');
const cases = {
  basic: `import { NeuTreeComponent } from '${tree}'; export { NeuTreeComponent };`,
  rich: `import { NeuTreeComponent, NeuTreeNodeDirective } from '${tree}'; export { NeuTreeComponent, NeuTreeNodeDirective };`,
  rootUnused: `import { NeuTreeComponent } from '${join(fesm, 'neural-ui-core.mjs')}';`,
};
const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const result = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'browser', minify: true,
    write: false, metafile: true, logLevel: 'silent',
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', '@neural-icons/*'],
  });
  const bytes = result.outputFiles[0].contents;
  const inputs = Object.keys(result.metafile.inputs);
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
