import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDirectFesmInputs, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const compare = join(fesm, 'neural-ui-core-compare.mjs');
const internal = join(fesm, 'neural-ui-core-internal.mjs');
const packageRoot = join(fesm, 'neural-ui-core.mjs');
const cases = {
  basic: `import {NeuCompareComponent} from '${compare}'; export const component=NeuCompareComponent;`,
  interactive: `import {NeuCompareComponent,NeuCompareHandleComponent} from '${compare}'; export const components=[NeuCompareComponent,NeuCompareHandleComponent];`,
  combined: `import {NeuCompareComponent,NeuCompareHandleComponent,NeuCompareIndicatorComponent,NeuCompareItemComponent} from '${compare}'; export const components=[NeuCompareComponent,NeuCompareHandleComponent,NeuCompareIndicatorComponent,NeuCompareItemComponent];`,
  rootUnused: `import {provideNeuralUI} from '${packageRoot}';`,
};
const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const bundle = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'js' },
    tsconfigRaw: { compilerOptions: {} },
    metafile: true,
    bundle: true, format: 'esm', platform: 'browser', minify: true, write: false,
    external: ['@angular/*', 'rxjs'],
    plugins: [{ name: 'n2-b5-private-internal', setup(plugin) {
      plugin.onResolve({ filter: /^@neural-ui\/core\/internal$/ }, () => ({ path: internal }));
    } }],
  });
  assertDirectFesmInputs(bundle.metafile, join(root, 'dist/neural-ui/core'), contents);
  const bytes = Buffer.concat(bundle.outputFiles.map(file => Buffer.from(file.contents)));
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
  };
}
if (results.rootUnused.raw !== 0) throw new Error('B5 root-unused must be 0 raw bytes');
console.log(JSON.stringify(results, null, 2));
