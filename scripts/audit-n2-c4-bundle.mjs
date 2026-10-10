import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDirectFesmInputs, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const palette = join(fesm, 'neural-ui-core-command-palette.mjs');
const cases = {
  basic: `import {NeuCommandPaletteComponent} from '${palette}'; export const component=NeuCommandPaletteComponent;`,
  opened: `import {NeuCommandPaletteComponent} from '${palette}'; export const component=NeuCommandPaletteComponent; export const commands=[{id:'a',kind:'action',label:'Action'}];`,
  grouped: `import {NeuCommandPaletteComponent,NeuCommandPaletteItemDirective} from '${palette}'; export const components=[NeuCommandPaletteComponent,NeuCommandPaletteItemDirective]; export const commands=[{id:'a',kind:'action',label:'Action',group:'Group'}];`,
  router: `import {NeuCommandPaletteComponent} from '${palette}'; export const component=NeuCommandPaletteComponent; export const commands=[{id:'r',kind:'router',label:'Route',routerLink:'/route'}];`,
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
      name: 'n2-c4-private-dependencies',
      setup(plugin) {
        plugin.onResolve({ filter: /^@neural-ui\/core\/(focus-trap|internal)$/ }, (args) => ({
          path: join(fesm, `neural-ui-core-${args.path.split('/').at(-1)}.mjs`),
        }));
      },
    }],
  });
  assertDirectFesmInputs(result.metafile, join(root, 'dist/neural-ui/core'), contents);
  const bytes = Buffer.concat(result.outputFiles.map((file) => Buffer.from(file.contents)));
  const inputs = Object.keys(result.metafile.inputs);
  const menuFacades = inputs.filter((file) => /neural-ui-core-(menu|mega-menu)\.mjs$/.test(file));
  if (menuFacades.length) throw new Error(`C4 retained Menu/MegaMenu facade: ${menuFacades.join(', ')}`);
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
    menuFacadeInputs: menuFacades.length,
    sourceInputs: inputs.filter((file) => /neural-ui-core-(command-palette|focus-trap|internal)\.mjs$/.test(file)),
  };
}
if (results.rootUnused.raw !== 0)
  throw new Error(`C4 root-unused retained ${results.rootUnused.raw} B`);
console.log(JSON.stringify(results, null, 2));
