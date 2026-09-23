import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const icon = (name) => `@neural-icons/core/icons/${name}`;
const cases = {
  oneStatic: `import {iconSave} from '${icon('save')}'; export const icon=iconSave;`,
  buttonSave: `import {NeuButtonComponent} from '${join(fesm, 'neural-ui-core-button.mjs')}';
    import {provideNeuralIcons} from '@neural-icons/angular';
    import {iconSave} from '${icon('save')}';
    export const component=NeuButtonComponent; export const providers=provideNeuralIcons(iconSave);`,
  buttonThree: `import {NeuButtonComponent} from '${join(fesm, 'neural-ui-core-button.mjs')}';
    import {provideNeuralIcons} from '@neural-icons/angular';
    import {iconSave} from '${icon('save')}';
    import {iconDownload} from '${icon('download')}';
    import {iconTrash} from '${icon('trash')}';
    export const component=NeuButtonComponent;
    export const providers=provideNeuralIcons(iconSave,iconDownload,iconTrash);`,
  representative: `import {NeuAlertComponent} from '${join(fesm, 'neural-ui-core-alert.mjs')}';
    import {NeuButtonComponent} from '${join(fesm, 'neural-ui-core-button.mjs')}';
    import {NeuDialogComponent} from '${join(fesm, 'neural-ui-core-modal.mjs')}';
    export const components=[NeuAlertComponent,NeuButtonComponent,NeuDialogComponent];`,
  rootUnused: `import {NeuButtonComponent} from '${join(fesm, 'neural-ui-core.mjs')}';`,
};

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const bundle = await build({
    stdin: { contents, sourcefile: 'n2-icon-consumer.ts', resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'browser', minify: true, write: false,
    external: ['@angular/*', 'rxjs'],
    plugins: [{ name: 'neural-package-entrypoints', setup(plugin) {
      plugin.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
        const suffix = path === '@neural-ui/core' ? '' : `-${path.slice('@neural-ui/core/'.length)}`;
        return { path: join(fesm, `neural-ui-core${suffix}.mjs`) };
      });
    } }],
  });
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
  buttonSave: ['save'],
  buttonThree: ['download', 'save', 'trash'],
})) {
  if (JSON.stringify(results[name].iconNames) !== JSON.stringify(expected)) {
    throw new Error(`${name}: unexpected icon geometry ${results[name].iconNames.join(', ')}`);
  }
}
console.log(JSON.stringify(results, null, 2));
