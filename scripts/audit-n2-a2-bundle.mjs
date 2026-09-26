import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDirectFesmInputs, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const entry = (name) => join(fesm, `neural-ui-core${name ? `-${name}` : ''}.mjs`);
const names = ['alert', 'badge', 'chip', 'empty-state', 'toast'];
const component = { alert: 'NeuAlertComponent', badge: 'NeuBadgeComponent', chip: 'NeuChipComponent', 'empty-state': 'NeuEmptyStateComponent', toast: 'NeuToastContainerComponent' };
const cases = Object.fromEntries(names.map((name) => [name, `import {${component[name]}} from '${entry(name)}'; export const component=${component[name]};`]));
cases.combined = names.map((name) => `import {${component[name]}} from '${entry(name)}';`).join('\n') + `\nexport const components=[${names.map((name) => component[name]).join(',')}];`;
cases.rootUnused = `import {provideNeuralUI} from '${entry('')}';`;

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const bundle = await build({
    stdin: { contents, sourcefile: 'n2-a2-consumer.ts', resolveDir: root, loader: 'js' },
    tsconfigRaw: { compilerOptions: {} },
    metafile: true,
    bundle: true, format: 'esm', platform: 'browser', minify: true, write: false,
    external: ['@angular/*', 'rxjs'],
    plugins: [{ name: 'n2-a2-private-entrypoints', setup(plugin) {
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
    iconNames: [...new Set([...code.matchAll(/name:"([a-z][a-z-]*)"/g)].map((match) => match[1]))].sort(),
  };
}
if (results.rootUnused.raw !== 0) throw new Error('A2 root-unused must remain 0 raw bytes.');
if (results.combined.iconNames.length > 6) throw new Error(`A2 retained unexpected icon catalog: ${results.combined.iconNames.join(', ')}`);
console.log(JSON.stringify(results, null, 2));
