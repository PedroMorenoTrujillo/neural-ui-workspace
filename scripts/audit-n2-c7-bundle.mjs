import { build } from 'esbuild';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const list = join(fesm, 'neural-ui-core-virtual-list.mjs');
const cases = {
  basic: `import { NeuVirtualListComponent } from '${list}'; export { NeuVirtualListComponent };`,
  template: `import { NeuVirtualListComponent, NeuVirtualItemDirective } from '${list}'; export { NeuVirtualListComponent, NeuVirtualItemDirective };`,
  largeConfig: `import { NeuVirtualListComponent } from '${list}'; export { NeuVirtualListComponent }; export const itemCount = 100000;`,
  rootUnused: `import { NeuVirtualListComponent } from '${join(fesm, 'neural-ui-core.mjs')}';`,
};
const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const result = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'browser', minify: true,
    write: false, metafile: true, logLevel: 'silent',
    external: ['@angular/*', 'rxjs', '@neural-icons/*'],
  });
  const bytes = result.outputFiles[0].contents;
  const inputs = Object.keys(result.metafile.inputs);
  results[name] = {
    raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes).length,
    listReachable: inputs.some((input) => input.includes('neural-ui-core-virtual-list.mjs')),
    forbiddenFacades: inputs.filter((input) => /neural-ui-core-(?:table|tree-table|tree|tree-select|listbox|scroller)\.mjs/.test(input)),
  };
}
if (results.rootUnused.raw !== 0 || results.rootUnused.listReachable)
  throw new Error('C7 root-unused retained VirtualList');
if (!results.basic.listReachable || results.basic.forbiddenFacades.length)
  throw new Error('C7 basic retained another facade');
console.log(JSON.stringify(results, null, 2));
