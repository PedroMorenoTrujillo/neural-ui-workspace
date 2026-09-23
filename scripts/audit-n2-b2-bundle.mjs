import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const menu = join(fesm, 'neural-ui-core-menu.mjs');
const internal = join(fesm, 'neural-ui-core-internal.mjs');
const packageRoot = join(fesm, 'neural-ui-core.mjs');
const names = ['NeuMenuComponent', 'NeuMenuButtonComponent', 'NeuMenubarComponent', 'NeuTieredMenuComponent'];
const cases = Object.fromEntries(names.map(name => [name, `import {${name}} from '${menu}'; export const component=${name};`]));
cases.combined = `import {${names.join(',')}} from '${menu}'; export const components=[${names.join(',')}];`;
cases.rootUnused = `import {${names.join(',')}} from '${packageRoot}';`;

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const bundle = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'browser', minify: true, write: false,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs'],
    plugins: [{ name: 'n2-b2-private-internal', setup(plugin) {
      plugin.onResolve({ filter: /^@neural-ui\/core\/internal$/ }, () => ({ path: internal }));
    } }],
  });
  const bytes = Buffer.concat(bundle.outputFiles.map(file => Buffer.from(file.contents)));
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
  };
}
if (results.rootUnused.raw !== 0) throw new Error('B2 root-unused must be 0 raw bytes');
console.log(JSON.stringify(results, null, 2));
