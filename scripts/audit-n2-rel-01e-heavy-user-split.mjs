import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { packageExportTarget } from './lib/rel-01-package-bundle-evidence.mjs';

const root = resolve(import.meta.dirname, '..');
const packageRoot = resolve(root, 'dist/neural-ui/core');
const state = packageExportTarget(packageRoot, '@neural-ui/core/internal-state');
const original = readFileSync(state, 'utf8');
const first = original.indexOf('/** @internal Request/client');
const second = original.indexOf('/** @internal Shared, lazy');
const end = original.indexOf('/** @internal Implementation boundary');
if (first < 0 || second < 0 || end < 0) throw new Error('Compiled state boundaries changed');
const header = original.slice(0, first);
const temporal = `${header}${original.slice(first, second)}\nexport { NeuInitialTemporalState };`;
const responsive = `${header}${original.slice(second, end)}\nexport { NeuResponsiveState };`;
const wrapper = "export { NeuInitialTemporalState } from './__rel01e_temporal.mjs';\n"
  + "export { NeuResponsiveState } from './__rel01e_responsive.mjs';\n";
const synthetic = new Map([
  [resolve(packageRoot, 'fesm2022/__rel01e_temporal.mjs'), temporal],
  [resolve(packageRoot, 'fesm2022/__rel01e_responsive.mjs'), responsive],
]);

async function measure(entry, split) {
  const result = await build({
    absWorkingDir: root,
    bundle: true,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'],
    format: 'esm',
    logLevel: 'silent',
    minify: true,
    platform: 'browser',
    plugins: [{ name: 'rel-01e-virtual-heavy-split', setup(api) {
      api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => ({
        path: packageExportTarget(packageRoot, path), sideEffects: false,
      }));
      api.onResolve({ filter: /^\.\/__rel01e_(?:temporal|responsive)\.mjs$/ }, ({ path }) => ({
        path: resolve(packageRoot, 'fesm2022', path), sideEffects: false,
      }));
      api.onLoad({ filter: /neural-ui-core-internal-state\.mjs$/ }, () => ({
        contents: split ? wrapper : original, loader: 'js', resolveDir: resolve(packageRoot, 'fesm2022'),
      }));
      api.onLoad({ filter: /__rel01e_(?:temporal|responsive)\.mjs$/ }, ({ path }) => ({
        contents: synthetic.get(path), loader: 'js', resolveDir: resolve(packageRoot, 'fesm2022'),
      }));
    } }],
    stdin: { contents: `import * as Entry from '@neural-ui/core/${entry}'; export { Entry };`, loader: 'js', resolveDir: root },
    treeShaking: true,
    tsconfigRaw: { compilerOptions: {} },
    write: false,
  });
  const bytes = Buffer.concat(result.outputFiles.map((file) => file.contents));
  return { size: [bytes.length, gzipSync(bytes, { level: 9 }).length,
    brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length],
  temporal: bytes.includes(Buffer.from('neu-temporal-state-')),
  responsive: bytes.includes(Buffer.from('matchMedia')) };
}

for (const entry of ['date-input', 'notification-center', 'mega-menu']) {
  console.log(JSON.stringify({ entry, real: await measure(entry, false), virtualSplit: await measure(entry, true) }));
}
