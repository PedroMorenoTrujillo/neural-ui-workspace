import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDirectFesmInputs, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const foundation = join(fesm, 'neural-ui-core-foundation.mjs');
const icon = (name) => `@neural-icons/core/icons/${name}`;
const cases = {
  oneStatic: `import {iconSave} from '${icon('save')}'; export const icon=iconSave;`,
  coreButtonOnly: `import {NeuButtonComponent} from '${join(fesm, 'neural-ui-core-button.mjs')}';
    export const component=NeuButtonComponent;`,
  buttonSave: `import {NeuButtonComponent} from '${join(fesm, 'neural-ui-core-button.mjs')}';
    import {provideNeuIconResolver} from '${foundation}';
    import {NeuralIcon} from '@neural-icons/angular';
    import {iconSave} from '${icon('save')}';
    export const component=NeuButtonComponent;
    export const providers=provideNeuIconResolver(({key,size,strokeWidth})=>
      key==='save'?{component:NeuralIcon,inputs:{icon:iconSave,size,strokeWidth}}:null);`,
  buttonThree: `import {NeuButtonComponent} from '${join(fesm, 'neural-ui-core-button.mjs')}';
    import {provideNeuIconResolver} from '${foundation}';
    import {NeuralIcon} from '@neural-icons/angular';
    import {iconSave} from '${icon('save')}';
    import {iconDownload} from '${icon('download')}';
    import {iconTrash} from '${icon('trash')}';
    export const component=NeuButtonComponent;
    const icons={save:iconSave,download:iconDownload,trash:iconTrash};
    export const providers=provideNeuIconResolver(({key,size,strokeWidth})=>
      icons[key]?{component:NeuralIcon,inputs:{icon:icons[key],size,strokeWidth}}:null);`,
  representative: `import {NeuAlertComponent} from '${join(fesm, 'neural-ui-core-alert.mjs')}';
    import {NeuButtonComponent} from '${join(fesm, 'neural-ui-core-button.mjs')}';
    import {NeuDialogComponent} from '${join(fesm, 'neural-ui-core-modal.mjs')}';
    export const components=[NeuAlertComponent,NeuButtonComponent,NeuDialogComponent];`,
  rootUnused: `import {provideNeuralUI} from '${join(fesm, 'neural-ui-core.mjs')}';`,
};

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const bundle = await build({
    stdin: { contents, sourcefile: 'n2-icon-consumer.ts', resolveDir: root, loader: 'js' },
    tsconfigRaw: { compilerOptions: {} },
    metafile: true,
    bundle: true, format: 'esm', platform: 'browser', minify: true, write: false,
    external: ['@angular/*', 'rxjs'],
    plugins: [{ name: 'neural-package-entrypoints', setup(plugin) {
      plugin.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
        const suffix = path === '@neural-ui/core' ? '' : `-${path.slice('@neural-ui/core/'.length)}`;
        return { path: join(fesm, `neural-ui-core${suffix}.mjs`) };
      });
    } }],
  });
  if (name !== 'oneStatic')
    assertDirectFesmInputs(bundle.metafile, join(root, 'dist/neural-ui/core'), contents);
  if (name === 'coreButtonOnly' || name === 'representative') {
    const iconInputs = Object.keys(bundle.metafile.inputs).filter((input) => input.includes('/@neural-icons/'));
    if (iconInputs.length) throw new Error(`${name}: Core-only bundle retained Neural Icons: ${iconInputs.join(', ')}`);
  }
  const bytes = Buffer.concat(bundle.outputFiles.map((file) => Buffer.from(file.contents)));
  const code = bytes.toString('utf8');
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
    iconNames: [...new Set([...code.matchAll(/name:"([a-z][a-z-]*)"/g)].map((match) => match[1]))].sort(),
  };
}
if (results.rootUnused.raw !== 0) throw new Error('A0.2 root-unused must be 0 raw bytes.');
for (const [name, expected] of Object.entries({
  oneStatic: ['save'],
  coreButtonOnly: [],
  buttonSave: ['save'],
  buttonThree: ['download', 'save', 'trash'],
  representative: [],
})) {
  if (JSON.stringify(results[name].iconNames) !== JSON.stringify(expected)) {
    throw new Error(`${name}: unexpected icon geometry ${results[name].iconNames.join(', ')}`);
  }
}
console.log(JSON.stringify(results, null, 2));
