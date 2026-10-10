import { readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { assertPackageOnlyBundle, packageExportTarget } from './lib/rel-01-package-bundle-evidence.mjs';

const root = resolve(import.meta.dirname, '..');
const packageRoot = resolve(root, 'dist/neural-ui/core');
const codec = { node: process.versions.node, zlib: process.versions.zlib, brotli: process.versions.brotli };
if (codec.node !== '22.22.3' || codec.zlib !== '1.2.12' || codec.brotli !== '1.2.0') {
  throw new Error(`REL-01E requires canonical codec: ${JSON.stringify(codec)}`);
}

async function measure(label, source) {
  const result = await build({
    absWorkingDir: root,
    bundle: true,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'],
    format: 'esm',
    logLevel: 'silent',
    metafile: true,
    minify: true,
    platform: 'browser',
    plugins: [{
      name: 'rel-01e-built-package-only',
      setup(api) {
        api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => ({
          path: packageExportTarget(packageRoot, path), sideEffects: false,
        }));
      },
    }],
    stdin: { contents: source, loader: 'js', resolveDir: root },
    treeShaking: true,
    tsconfigRaw: { compilerOptions: {} },
    write: false,
  });
  const specifiers = assertPackageOnlyBundle(result.metafile, packageRoot, source, root);
  const bytes = Buffer.concat(result.outputFiles.map((file) => file.contents));
  const code = bytes.toString('utf8');
  const outputs = Object.values(result.metafile.outputs);
  const inputBytes = Object.entries(outputs[0]?.inputs ?? {})
    .filter(([name]) => name.includes('dist/neural-ui/core/fesm2022/'))
    .map(([name, value]) => [name.split('/').at(-1), value.bytesInOutput])
    .sort((a, b) => b[1] - a[1]);
  return {
    label,
    size: [bytes.length, gzipSync(bytes, { level: 9 }).length,
      brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length],
    temporal: code.includes('neu-temporal-state-'),
    responsive: code.includes('matchMedia'),
    eyedropper: code.includes('EyeDropper'),
    specifiers,
    inputBytes,
    packageInputs: Object.keys(result.metafile.inputs)
      .filter((name) => name.includes('dist/neural-ui/core/fesm2022/'))
      .map((name) => relative(packageRoot, resolve(root, name))).sort(),
  };
}

const sourceRoot = resolve(root, 'projects/ui-core');
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = resolve(dir, name);
    if (statSync(file).isDirectory()) walk(file);
    else if (name.endsWith('.ts') && !name.includes('.spec.') && !file.includes('/internal/')) {
      const content = readFileSync(file, 'utf8');
      if (content.includes('NeuIdGenerator')) files.push({
        entry: relative(sourceRoot, file).split('/')[0],
        heavy: /\bNeuInitialTemporalState\b|\bNeuResponsiveState\b/.test(content),
      });
    }
  }
}
walk(sourceRoot);
const entries = [...new Set(files.map((file) => file.entry))].sort();
const idOnly = entries.filter((entry) => files.filter((file) => file.entry === entry).every((file) => !file.heavy));
function namespaceSource(names) {
  return names.map((name, index) => `import * as E${index} from '@neural-ui/core/${name}';`)
    .join('\n') + '\n' + names.map((_, index) => `export { E${index} };`).join('\n');
}
const direct = [
  ['minimal-id', "import { NeuIdGenerator } from '@neural-ui/core/internal'; export const ID_GENERATOR = NeuIdGenerator;"],
  ['kanban', "import { NeuKanbanComponent } from '@neural-ui/core/kanban'; export { NeuKanbanComponent };"],
  ['color-picker', "import { NeuColorPickerComponent } from '@neural-ui/core/color-picker'; export { NeuColorPickerComponent };"],
  ['kanban+color-picker', "import { NeuKanbanComponent } from '@neural-ui/core/kanban'; import { NeuColorPickerComponent } from '@neural-ui/core/color-picker'; export { NeuKanbanComponent, NeuColorPickerComponent };"],
  ['foundation-token', "import { NEURAL_NOW } from '@neural-ui/core/foundation'; export { NEURAL_NOW };"],
];
for (const [label, source] of direct) console.log(JSON.stringify(await measure(label, source)));
for (const entry of entries) console.log(JSON.stringify({ entry, idOnly: idOnly.includes(entry),
  ...await measure(`entry:${entry}`, namespaceSource([entry])) }));
for (const [label, names] of [
  ['id-only-5', idOnly.slice(0, 5)], ['id-only-10', idOnly.slice(0, 10)],
  ['id-only-all', idOnly], ['all-39', entries],
]) console.log(JSON.stringify({ composition: label, entries: names,
  ...await measure(`composition:${label}`, namespaceSource(names)) }));
