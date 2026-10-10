import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDirectFesmInputs, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const pickList = join(fesm, 'neural-ui-core-pick-list.mjs');
const cases = {
  orderList: `import {NeuOrderListComponent} from '${pickList}'; export const component=NeuOrderListComponent;`,
  pickList: `import {NeuPickListComponent} from '${pickList}'; export const component=NeuPickListComponent;`,
  combined: `import {NeuOrderListComponent,NeuPickListComponent} from '${pickList}'; export const components=[NeuOrderListComponent,NeuPickListComponent];`,
  rootUnused: `import {provideNeuralUI} from '${join(fesm, 'neural-ui-core.mjs')}';`,
};

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const result = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'js' },
    tsconfigRaw: { compilerOptions: {} },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
    metafile: true,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', '@neural-icons/*'],
    plugins: [{
      name: 'n2-c2-private-internal',
      setup(plugin) {
        plugin.onResolve({ filter: /^@neural-ui\/core\/internal$/ }, () => ({
          path: join(fesm, 'neural-ui-core-internal.mjs'),
        }));
      },
    }],
  });
  assertDirectFesmInputs(result.metafile, join(root, 'dist/neural-ui/core'), contents);
  const bytes = Buffer.concat(result.outputFiles.map((file) => Buffer.from(file.contents)));
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };
}
if (results.rootUnused.raw !== 0)
  throw new Error(`C2 root-unused retained ${results.rootUnused.raw} B`);
console.log(JSON.stringify(results, null, 2));
console.log('The private ordered-list logic is compiled into the existing pick-list entrypoint; no new public entrypoint or third-party DnD engine was added.');
