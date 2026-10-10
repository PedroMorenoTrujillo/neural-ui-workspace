import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDirectFesmInputs, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const entry = (name) => join(fesm, `neural-ui-core${name ? `-${name}` : ''}.mjs`);
const symbols = {
  'meter-group': ['NeuMeterGroupComponent'],
  'progress-bar': ['NeuProgressBarComponent'],
  'stats-card': ['NeuStatsCardComponent'],
  'form-field': ['NeuFormFieldComponent', 'NeuInputGroupComponent'],
};
const imports = Object.entries(symbols).map(([name, values]) =>
  `import {${values.join(',')}} from '${entry(name)}';`,
);
const cases = Object.fromEntries(Object.entries(symbols).map(([name, values], index) => [
  name, `${imports[index]} export const components=[${values.join(',')}];`,
]));
cases.combined = `${imports.join('\n')}\nexport const components=[${Object.values(symbols).flat().join(',')}];`;
cases.rootUnused = `import {provideNeuralUI} from '${entry('')}';`;

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const bundle = await build({
    stdin: { contents, sourcefile: 'n2-a4-consumer.ts', resolveDir: root, loader: 'js' },
    tsconfigRaw: { compilerOptions: {} },
    metafile: true,
    bundle: true, format: 'esm', platform: 'browser', minify: true, write: false,
    external: ['@angular/*', 'rxjs'],
    plugins: [{ name: 'n2-a4-private-entrypoints', setup(plugin) {
      plugin.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => ({
        path: entry(path === '@neural-ui/core' ? '' : path.slice('@neural-ui/core/'.length)),
      }));
    } }],
  });
  assertDirectFesmInputs(bundle.metafile, join(root, 'dist/neural-ui/core'), contents);
  const bytes = Buffer.concat(bundle.outputFiles.map((file) => Buffer.from(file.contents)));
  const code = bytes.toString('utf8');
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
    svgChart: /sparkline|sparkData|sparkPoints|<polyline/.test(code),
  };
}
if (results.rootUnused.raw !== 0) throw new Error('A4 root-unused must remain 0 raw bytes.');
if (results['stats-card'].svgChart) throw new Error('StatsCard still retains chart-specific runtime.');
console.log(JSON.stringify(results, null, 2));
