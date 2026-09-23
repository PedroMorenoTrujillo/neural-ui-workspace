import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const splitter = join(fesm, 'neural-ui-core-splitter.mjs');
const panel = join(fesm, 'neural-ui-core-panel.mjs');
const internal = join(fesm, 'neural-ui-core-internal.mjs');
const packageRoot = join(fesm, 'neural-ui-core.mjs');
const cases = {
  splitterBasic: `import {NeuSplitterComponent} from "${splitter}"; export const component=NeuSplitterComponent;`,
  splitterInteractive: `import {NeuSplitterComponent} from "${splitter}"; export const component=NeuSplitterComponent; export const usage='pointer+keyboard';`,
  scrollNative: `import {NeuScrollAreaComponent} from "${panel}"; export const component=NeuScrollAreaComponent;`,
  scrollEnhanced: `import {NeuScrollAreaComponent} from "${panel}"; export const component=NeuScrollAreaComponent; export const enhanced=true;`,
  combined: `import {NeuSplitterComponent} from "${splitter}"; import {NeuScrollAreaComponent} from "${panel}"; export const components=[NeuSplitterComponent,NeuScrollAreaComponent];`,
  rootUnused: `import {NeuSplitterComponent,NeuScrollAreaComponent} from "${packageRoot}";`,
};

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const bundle = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'browser', minify: true, write: false,
    external: ['@angular/*', 'rxjs', '@ng-icons/*'],
    plugins: [{
      name: 'n2-b9-private-internal',
      setup(plugin) {
        plugin.onResolve({ filter: /^@neural-ui\/core\/internal$/ }, () => ({ path: internal }));
      },
    }],
  });
  const bytes = Buffer.concat(bundle.outputFiles.map((file) => Buffer.from(file.contents)));
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };
}
if (results.rootUnused.raw !== 0) throw new Error('B9 root-unused must be 0 raw bytes');
console.log(JSON.stringify(results, null, 2));
