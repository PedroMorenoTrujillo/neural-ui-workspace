import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDirectFesmInputs, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const entries = {
  'dashboard-grid': 'NeuDashboardGridComponent',
  'data-view': 'NeuDataViewComponent',
};
const cases = Object.fromEntries(
  Object.entries(entries).map(([entry, symbol]) => [
    entry,
    `import {${symbol}} from '${join(fesm, `neural-ui-core-${entry}.mjs`)}'; export const component=${symbol};`,
  ]),
);
cases.combined =
  Object.entries(entries)
    .map(
      ([entry, symbol]) =>
        `import {${symbol}} from '${join(fesm, `neural-ui-core-${entry}.mjs`)}';`,
    )
    .join('\n') + `\nexport const components=[${Object.values(entries).join(',')}];`;
cases.rootUnused = `import {provideNeuralUI} from '${join(fesm, 'neural-ui-core.mjs')}';`;

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const bundle = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'js' },
    tsconfigRaw: { compilerOptions: {} },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
    metafile: true,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs'],
    plugins: [
      {
        name: 'n2-b6-private-internal',
        setup(plugin) {
          plugin.onResolve({ filter: /^@neural-ui\/core\/internal$/ }, () => ({
            path: join(fesm, 'neural-ui-core-internal.mjs'),
          }));
        },
      },
    ],
  });
  assertDirectFesmInputs(bundle.metafile, join(root, 'dist/neural-ui/core'), contents);
  const bytes = Buffer.concat(bundle.outputFiles.map((file) => Buffer.from(file.contents)));
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
  };
  if (name !== 'rootUnused') {
    results[name].externalImports = Object.values(bundle.metafile.outputs)
      .flatMap((output) => output.imports.filter((item) => item.external).map((item) => item.path))
      .filter((value, index, values) => values.indexOf(value) === index)
      .sort();
    results[name].topSources = Object.values(bundle.metafile.outputs)
      .flatMap((output) =>
        Object.entries(output.inputs).map(([path, detail]) => ({
          source: path.split('/').at(-1),
          bytes: detail.bytesInOutput,
        })),
      )
      .sort((left, right) => right.bytes - left.bytes)
      .slice(0, 8);
  }
}
if (results.rootUnused.raw !== 0) throw new Error('B6 root-unused must be 0 raw bytes');
console.log(JSON.stringify(results, null, 2));
