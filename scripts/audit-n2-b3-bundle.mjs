import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const entries = {
  carousel: 'NeuCarouselComponent',
  'split-button': 'NeuSplitButtonComponent',
  'speed-dial': 'NeuSpeedDialComponent',
};
const cases = Object.fromEntries(
  Object.entries(entries).map(([entry, name]) => [
    entry,
    `import {${name}} from '${join(fesm, `neural-ui-core-${entry}.mjs`)}'; export const component=${name};`,
  ]),
);
cases.combined =
  Object.entries(entries)
    .map(([entry, name]) => `import {${name}} from '${join(fesm, `neural-ui-core-${entry}.mjs`)}';`)
    .join('\n') + `\nexport const components=[${Object.values(entries).join(',')}];`;
cases.rootUnused = `import {${Object.values(entries).join(',')}} from '${join(fesm, 'neural-ui-core.mjs')}';`;

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const bundle = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs'],
    plugins: [
      {
        name: 'n2-b3-private-internal',
        setup(plugin) {
          plugin.onResolve({ filter: /^@neural-ui\/core\/internal$/ }, () => ({
            path: join(fesm, 'neural-ui-core-internal.mjs'),
          }));
        },
      },
    ],
  });
  const bytes = Buffer.concat(bundle.outputFiles.map((file) => Buffer.from(file.contents)));
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
  };
}
if (results.rootUnused.raw !== 0) throw new Error('B3 root-unused must be 0 raw bytes');
console.log(JSON.stringify(results, null, 2));
