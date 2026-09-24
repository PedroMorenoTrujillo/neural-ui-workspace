import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const mega = join(fesm, 'neural-ui-core-mega-menu.mjs');
const cases = {
  basic: `import {NeuMegaMenuComponent} from '${mega}'; export const component=NeuMegaMenuComponent;`,
  richPanel: `import {NeuMegaMenuComponent} from '${mega}'; export const component=NeuMegaMenuComponent; export const model=[{key:'products',label:'Products',kind:'panel',panel:{columns:[{key:'c',groups:[{key:'g',label:'Resources',items:[{key:'docs',label:'Docs',kind:'link',url:'/docs'}]}]}]}}];`,
  templates: `import {NeuMegaMenuComponent,NeuMegaMenuItemDirective,NeuMegaMenuStartDirective,NeuMegaMenuEndDirective} from '${mega}'; export const components=[NeuMegaMenuComponent,NeuMegaMenuItemDirective,NeuMegaMenuStartDirective,NeuMegaMenuEndDirective];`,
  rootUnused: `import {NeuMegaMenuComponent} from '${join(fesm, 'neural-ui-core.mjs')}';`,
};

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const result = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
    metafile: true,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', '@neural-icons/*'],
    plugins: [{
      name: 'n2-c3-private-internal',
      setup(plugin) {
        plugin.onResolve({ filter: /^@neural-ui\/core\/internal$/ }, () => ({
          path: join(fesm, 'neural-ui-core-internal.mjs'),
        }));
      },
    }],
  });
  const bytes = Buffer.concat(result.outputFiles.map((file) => Buffer.from(file.contents)));
  const inputs = Object.keys(result.metafile.inputs);
  const b2Facade = inputs.filter((file) => /neural-ui-core-menu\.mjs$/.test(file));
  if (b2Facade.length) throw new Error(`MegaMenu retained B2 facade: ${b2Facade.join(', ')}`);
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
    b2FacadeInputs: b2Facade.length,
  };
}
if (results.rootUnused.raw !== 0)
  throw new Error(`C3 root-unused retained ${results.rootUnused.raw} B`);
console.log(JSON.stringify(results, null, 2));
