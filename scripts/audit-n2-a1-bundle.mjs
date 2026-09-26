import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDirectFesmInputs, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const entry = (name) => join(fesm, `neural-ui-core${name ? `-${name}` : ''}.mjs`);
const cases = {
  buttonBasic: `import {NeuButtonComponent} from '${entry('button')}'; export const component=NeuButtonComponent;`,
  buttonSave: `import {NeuButtonComponent} from '${entry('button')}';
    import {provideNeuralIcons} from '@neural-icons/angular';
    import {iconSave} from '@neural-icons/core/icons/save';
    export const component=NeuButtonComponent; export const providers=provideNeuralIcons(iconSave);`,
  buttonSaveDownload: `import {NeuButtonComponent} from '${entry('button')}';
    import {provideNeuralIcons} from '@neural-icons/angular';
    import {iconSave} from '@neural-icons/core/icons/save';
    import {iconDownload} from '@neural-icons/core/icons/download';
    export const component=NeuButtonComponent; export const providers=provideNeuralIcons(iconSave,iconDownload);`,
  buttonGroup: `import {NeuButtonGroupComponent} from '${entry('button-group')}'; export const component=NeuButtonGroupComponent;`,
  tag: `import {NeuTagComponent} from '${entry('tag')}'; export const component=NeuTagComponent;`,
  toolbar: `import {NeuToolbarComponent} from '${entry('toolbar')}'; export const component=NeuToolbarComponent;`,
  combined: `import {NeuButtonComponent} from '${entry('button')}';
    import {NeuButtonGroupComponent} from '${entry('button-group')}';
    import {NeuTagComponent} from '${entry('tag')}';
    import {NeuToolbarComponent} from '${entry('toolbar')}';
    export const components=[NeuButtonComponent,NeuButtonGroupComponent,NeuTagComponent,NeuToolbarComponent];`,
  rootUnused: `import {provideNeuralUI} from '${entry('')}';`,
};

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const bundle = await build({
    stdin: { contents, sourcefile: 'n2-a1-consumer.ts', resolveDir: root, loader: 'js' },
    tsconfigRaw: { compilerOptions: {} },
    metafile: true,
    bundle: true, format: 'esm', platform: 'browser', minify: true, write: false,
    external: ['@angular/*', 'rxjs'],
    plugins: [{ name: 'n2-a1-private-entrypoints', setup(plugin) {
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
if (results.rootUnused.raw !== 0) throw new Error('A1 root-unused must remain 0 raw bytes.');
for (const [name, expected] of Object.entries({ buttonSave: ['save'], buttonSaveDownload: ['download', 'save'] })) {
  if (JSON.stringify(results[name].iconNames) !== JSON.stringify(expected)) {
    throw new Error(`${name}: unexpected icon geometry ${results[name].iconNames.join(', ')}`);
  }
}
console.log(JSON.stringify(results, null, 2));
