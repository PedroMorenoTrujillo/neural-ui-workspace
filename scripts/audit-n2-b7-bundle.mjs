import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const slider = join(fesm, 'neural-ui-core-slider.mjs');
const rating = join(fesm, 'neural-ui-core-rating.mjs');
const internal = join(fesm, 'neural-ui-core-internal.mjs');
const packageRoot = join(fesm, 'neural-ui-core.mjs');
const cases = {
  scalar: `import {NeuSliderComponent} from "${slider}"; export const control=NeuSliderComponent; export const data=50;`,
  range: `import {NeuSliderComponent} from "${slider}"; export const control=NeuSliderComponent; export const data=[20,80];`,
  integer: `import {NeuRatingComponent} from "${rating}"; export const control=NeuRatingComponent; export const data=3;`,
  half: `import {NeuRatingComponent} from "${rating}"; export const control=NeuRatingComponent; export const data=2.5;`,
  combined: `import {NeuSliderComponent} from "${slider}"; import {NeuRatingComponent} from "${rating}"; export const controls=[NeuSliderComponent,NeuRatingComponent];`,
  rootUnused: `import {NeuSliderComponent} from "${packageRoot}"; import {NeuRatingComponent} from "${packageRoot}";`,
};

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const bundle = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
    external: ['@angular/*', 'rxjs'],
    plugins: [{
      name: 'n2-b7-private-internal',
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
if (results.rootUnused.raw !== 0) throw new Error('B7 root-unused must be 0 raw bytes');
console.log(JSON.stringify(results, null, 2));
