import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const workspace = resolve(import.meta.dirname, '..');
const packageRoot = resolve(workspace, 'dist/neural-ui/core');
const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
if (!Array.isArray(manifest.sideEffects)
  || !manifest.sideEffects.every((name) => /^\.\/styles(?:\/.*)?\.s?css$/.test(name))) {
  throw new Error('Compiled package does not certify JS entrypoints as side-effect-free');
}
const internal = resolve(packageRoot, 'fesm2022/neural-ui-core-internal.mjs');
const original = readFileSync(internal, 'utf8');
const header = original.slice(0, original.indexOf('/** @internal Application-scoped'));
const idStart = original.indexOf('/** @internal Application-scoped');
const heavyStart = original.indexOf('/** @internal Request/client');
const heavyEnd = original.indexOf('\nfunction resolveNeuMenuAction', heavyStart);
const syntheticId = resolve(packageRoot, 'fesm2022/neural-ui-core-id-experiment.mjs');
const syntheticHeavy = resolve(packageRoot, 'fesm2022/neural-ui-core-heavy-experiment.mjs');
const external = ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'];
const targets = Object.fromEntries(Object.entries(manifest.exports)
  .filter(([key, value]) => key.startsWith('./') && value?.default?.endsWith('.mjs'))
  .map(([key, value]) => [`@neural-ui/core${key.slice(1)}`, resolve(packageRoot, value.default)]));

function transform(mode) {
  if (!mode) return original;
  if (mode.startsWith('decl-')) {
    const parts = mode.split('-');
    const action = parts[1];
    const target = parts[2];
    const kinds = parts.slice(3);
    const names = target === 'all' ? ['NeuIdGenerator', 'NeuInitialTemporalState', 'NeuResponsiveState']
      : target === 'both' ? ['NeuInitialTemporalState', 'NeuResponsiveState']
      : target === 'temporal' ? ['NeuInitialTemporalState']
        : target === 'responsive' ? ['NeuResponsiveState'] : ['NeuIdGenerator'];
    let output = original;
    let changed = 0;
    if (kinds.includes('meta')) {
      output = output.replace(/i0\.ɵɵngDeclareClassMetadata\(\{[\s\S]*?\}\);/g, (call) => {
        if (!names.some((name) => call.includes(`type: ${name},`))) return call;
        changed++;
        return action === 'drop' ? '' : `/* @__PURE__ */ ${call}`;
      });
    }
    for (const kind of ['fac', 'prov']) {
      if (!kinds.includes(kind)) continue;
      const method = kind === 'fac' ? 'Factory' : 'Injectable';
      const re = new RegExp(`static ɵ${kind} = i0\\.ɵɵngDeclare${method}\\(\\{[^;]*?\\}\\);`, 'g');
      output = output.replace(re, (call) => {
        if (!names.some((name) => call.includes(`type: ${name},`))) return call;
        changed++;
        return action === 'drop' ? '' : call.replace(`i0.ɵɵngDeclare${method}`, `/* @__PURE__ */ i0.ɵɵngDeclare${method}`);
      });
    }
    if (!changed) throw new Error(`No declaration transformed for ${mode}`);
    return output;
  }
  const calls = [...original.matchAll(/i0\.ɵɵngDeclareClassMetadata\(\{[\s\S]*?\}\);/g)];
  if (calls.length !== 4) throw new Error(`Expected four metadata calls, found ${calls.length}`);
  const names = ['NeuIdGenerator', 'NeuInitialTemporalState', 'NeuResponsiveState'];
  const selected = mode.includes('all') ? names : mode.includes('temporal') ? [names[1]]
    : mode.includes('responsive') ? [names[2]] : mode.includes('id') ? [names[0]] : [];
  let changed = 0;
  const output = original.replace(/i0\.ɵɵngDeclareClassMetadata\(\{[\s\S]*?\}\);/g, (call) => {
    if (!selected.some((name) => call.includes(`type: ${name},`))) return call;
    changed++;
    return mode.startsWith('drop') ? '' : `/* @__PURE__ */ ${call}`;
  });
  if (!changed) throw new Error(`No metadata call transformed for ${mode}`);
  return output;
}

async function measure(label, source, options = {}) {
  const seen = [];
  let transformed = transform(options.transform);
  let synthetic;
  if (options.split === 'heavy') {
    synthetic = { path: syntheticHeavy, contents: `${header}${original.slice(heavyStart, heavyEnd)}\nexport { NeuInitialTemporalState, NeuResponsiveState };\n` };
    transformed = transformed.slice(0, heavyStart)
      + `export { NeuInitialTemporalState, NeuResponsiveState } from './neural-ui-core-heavy-experiment.mjs';\n`
      + transformed.slice(heavyEnd);
    transformed = transformed.replace(/, NeuInitialTemporalState, NeuResponsiveState,/, ',');
  } else if (options.split === 'id') {
    synthetic = { path: syntheticId, contents: `${header}${original.slice(idStart, heavyStart)}\nexport { NeuIdGenerator };\n` };
    transformed = transformed.slice(0, idStart)
      + `export { NeuIdGenerator } from './neural-ui-core-id-experiment.mjs';\n`
      + transformed.slice(heavyStart);
    transformed = transformed.replace(/, NeuIdGenerator,/, ',');
  }
  const result = await build({
    absWorkingDir: workspace,
    bundle: true,
    external,
    format: 'esm',
    logLevel: 'silent',
    metafile: true,
    minify: options.minify ?? true,
    minifySyntax: options.minifySyntax,
    platform: 'browser',
    treeShaking: options.treeShaking,
    ignoreAnnotations: options.ignoreAnnotations,
    pure: options.pure,
    define: options.define,
    plugins: [{
      name: 'rel-01d-virtual-compiled-package',
      setup(api) {
        api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
          const target = targets[path];
          if (!target) throw new Error(`No package export for ${path}`);
          seen.push(path);
          return { path: target, sideEffects: options.sideEffects ?? false };
        });
        api.onResolve({ filter: /^\.\/neural-ui-core-(?:id|heavy)-experiment\.mjs$/ }, ({ path }) => ({
          path: path.includes('heavy') ? syntheticHeavy : syntheticId, sideEffects: false,
        }));
        if (synthetic) api.onLoad({ filter: /neural-ui-core-(?:id|heavy)-experiment\.mjs$/ }, () => ({
          contents: synthetic.contents, loader: 'js', resolveDir: resolve(packageRoot, 'fesm2022'),
        }));
        api.onLoad({ filter: /neural-ui-core-internal\.mjs$/ }, ({ path }) => ({
          contents: transformed, loader: 'js', resolveDir: resolve(path, '..'),
        }));
      },
    }],
    stdin: { contents: source, loader: 'js', resolveDir: workspace },
    tsconfigRaw: { compilerOptions: {} },
    write: false,
  });
  const output = Buffer.concat(result.outputFiles.map((file) => file.contents));
  const code = output.toString('utf8');
  const packageInputs = Object.keys(result.metafile.inputs).filter((name) => {
    const p = relative(packageRoot, resolve(workspace, name));
    return p && !p.startsWith('..');
  });
  if (options.requireInternal !== false && !packageInputs.some((name) => name.endsWith('neural-ui-core-internal.mjs')))
    throw new Error(`${label}: compiled internal FESM missing`);
  if (Object.keys(result.metafile.inputs).some((name) => /(?:^|\/)projects\/ui-core\//.test(name)))
    throw new Error(`${label}: workspace source leaked`);
  return {
    label, raw: output.length,
    gzip: gzipSync(output, { level: 9 }).length,
    brotli: brotliCompressSync(output, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
    temporal: code.includes('neu-temporal-state-'), responsive: code.includes('matchMedia'),
    metadataCalls: (code.match(/ɵɵngDeclareClassMetadata/g) ?? []).length,
    packageInputs: packageInputs.map((name) => relative(packageRoot, resolve(workspace, name))).sort(),
    seen,
  };
}

const id = "import { NeuIdGenerator } from '@neural-ui/core/internal'; export const ID_GENERATOR = NeuIdGenerator;";
const cases = [
  ['default', id, {}],
  ['foundation-token', "import { NEURAL_NOW } from '@neural-ui/core/foundation'; export { NEURAL_NOW };", { requireInternal: false, treeShaking: true }],
  ['tree-true', id, { treeShaking: true }],
  ['tree-false', id, { treeShaking: false }],
  ['minify-false', id, { minify: false, treeShaking: true }],
  ['syntax-only', id, { minify: false, minifySyntax: true, treeShaking: true }],
  ['ignore-annotations', id, { ignoreAnnotations: true, treeShaking: true }],
  ['sideeffects-true', id, { sideEffects: true, treeShaking: true }],
  ['devdefs-false', id, { define: { ngDevMode: 'false', ngJitMode: 'false' }, treeShaking: true }],
  ['pure-option-angular-declarations', id, { pure: ['i0.ɵɵngDeclareFactory', 'i0.ɵɵngDeclareInjectable', 'i0.ɵɵngDeclareClassMetadata'], treeShaking: true }],
  ['drop-temporal-metadata', id, { transform: 'drop-temporal', treeShaking: true }],
  ['drop-responsive-metadata', id, { transform: 'drop-responsive', treeShaking: true }],
  ['drop-all-metadata', id, { transform: 'drop-all', treeShaking: true }],
  ['pure-temporal-metadata', id, { transform: 'pure-temporal', treeShaking: true }],
  ['pure-responsive-metadata', id, { transform: 'pure-responsive', treeShaking: true }],
  ['pure-all-metadata', id, { transform: 'pure-all', treeShaking: true }],
  ['drop-temporal-fac', id, { transform: 'decl-drop-temporal-fac', treeShaking: true }],
  ['drop-temporal-prov', id, { transform: 'decl-drop-temporal-prov', treeShaking: true }],
  ['drop-temporal-fac-prov', id, { transform: 'decl-drop-temporal-fac-prov', treeShaking: true }],
  ['drop-temporal-fac-meta', id, { transform: 'decl-drop-temporal-fac-meta', treeShaking: true }],
  ['drop-temporal-prov-meta', id, { transform: 'decl-drop-temporal-prov-meta', treeShaking: true }],
  ['drop-temporal-all', id, { transform: 'decl-drop-temporal-fac-prov-meta', treeShaking: true }],
  ['drop-responsive-fac', id, { transform: 'decl-drop-responsive-fac', treeShaking: true }],
  ['drop-responsive-prov', id, { transform: 'decl-drop-responsive-prov', treeShaking: true }],
  ['drop-responsive-fac-prov', id, { transform: 'decl-drop-responsive-fac-prov', treeShaking: true }],
  ['drop-responsive-fac-meta', id, { transform: 'decl-drop-responsive-fac-meta', treeShaking: true }],
  ['drop-responsive-prov-meta', id, { transform: 'decl-drop-responsive-prov-meta', treeShaking: true }],
  ['drop-responsive-all', id, { transform: 'decl-drop-responsive-fac-prov-meta', treeShaking: true }],
  ['drop-both-all', id, { transform: 'decl-drop-all-fac-prov-meta', treeShaking: true }],
  ['drop-heavy-all', id, { transform: 'decl-drop-both-fac-prov-meta', treeShaking: true }],
  ['drop-id-declarations-facade-proxy', id, { transform: 'decl-drop-id-fac-prov-meta', treeShaking: true }],
  ['pure-both-all', id, { transform: 'decl-pure-all-fac-prov-meta', treeShaking: true }],
  ['direct-fesm', `import { NeuIdGenerator } from '${internal}'; export const ID_GENERATOR = NeuIdGenerator;`, { treeShaking: true }],
  ['split-heavy-id', id, { split: 'heavy', treeShaking: true }],
  ['split-id-id', id, { split: 'id', treeShaking: true }],
  ['kanban', "import { NeuKanbanComponent } from '@neural-ui/core/kanban'; export { NeuKanbanComponent };", { treeShaking: true }],
  ['color-picker', "import { NeuColorPickerComponent } from '@neural-ui/core/color-picker'; export { NeuColorPickerComponent };", { treeShaking: true }],
  ['kanban+color-picker', "import { NeuKanbanComponent } from '@neural-ui/core/kanban'; import { NeuColorPickerComponent } from '@neural-ui/core/color-picker'; export { NeuKanbanComponent, NeuColorPickerComponent };", { treeShaking: true }],
  ['split-heavy-kanban', "import { NeuKanbanComponent } from '@neural-ui/core/kanban'; export { NeuKanbanComponent };", { split: 'heavy', treeShaking: true }],
  ['split-heavy-color-picker', "import { NeuColorPickerComponent } from '@neural-ui/core/color-picker'; export { NeuColorPickerComponent };", { split: 'heavy', treeShaking: true }],
  ['split-heavy-kanban+color-picker', "import { NeuKanbanComponent } from '@neural-ui/core/kanban'; import { NeuColorPickerComponent } from '@neural-ui/core/color-picker'; export { NeuKanbanComponent, NeuColorPickerComponent };", { split: 'heavy', treeShaking: true }],
  ['split-id-kanban', "import { NeuKanbanComponent } from '@neural-ui/core/kanban'; export { NeuKanbanComponent };", { split: 'id', treeShaking: true }],
  ['split-id-color-picker', "import { NeuColorPickerComponent } from '@neural-ui/core/color-picker'; export { NeuColorPickerComponent };", { split: 'id', treeShaking: true }],
];

if (process.argv.includes('--entrypoints')) {
  const sourceRoot = resolve(workspace, 'projects/ui-core');
  const files = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const file = resolve(dir, name);
      if (statSync(file).isDirectory()) walk(file);
      else if (name.endsWith('.ts') && !name.includes('.spec.') && !file.includes('/internal/')) {
        const content = readFileSync(file, 'utf8');
        if (content.includes('NeuIdGenerator')) files.push({
          file, entry: relative(sourceRoot, file).split('/')[0],
          legitimateHeavy: /\bNeuInitialTemporalState\b|\bNeuResponsiveState\b/.test(content),
        });
      }
    }
  }
  walk(sourceRoot);
  const entries = [...new Set(files.map((file) => file.entry))].sort();
  const idOnly = entries.filter((entry) => files.filter((file) => file.entry === entry)
    .every((file) => !file.legitimateHeavy));
  function compose(names) {
    return names.map((name, index) => `import * as E${index} from '@neural-ui/core/${name}';`)
      .join('\n') + '\n' + names.map((_, index) => `export { E${index} };`).join('\n');
  }
  console.log(JSON.stringify({ inventory: { files: files.length, entries: entries.length, idOnlyEntries: idOnly.length, legitimateHeavy: files.filter((file) => file.legitimateHeavy).map((file) => file.entry) } }));
  for (const entry of entries) {
    try {
      const source = compose([entry]);
      const baseline = await measure(entry, source, { treeShaking: true });
      const removed = await measure(entry, source, { treeShaking: true, transform: 'decl-drop-both-fac-prov-meta' });
      console.log(JSON.stringify({ entry, idOnly: idOnly.includes(entry), baseline: [baseline.raw, baseline.gzip, baseline.brotli, baseline.temporal, baseline.responsive], removed: [removed.raw, removed.gzip, removed.brotli, removed.temporal, removed.responsive] }));
    } catch (error) { console.log(JSON.stringify({ entry, error: String(error) })); }
  }
  for (const [label, names] of [
    ['kanban+color-picker', ['kanban', 'color-picker']],
    ['id-only-5', idOnly.slice(0, 5)],
    ['id-only-10', idOnly.slice(0, 10)],
    ['id-only-all', idOnly],
    ['all-39', entries],
  ]) {
    try {
      const source = compose(names);
      const baseline = await measure(label, source, { treeShaking: true });
      const removed = await measure(label, source, { treeShaking: true, transform: 'decl-drop-both-fac-prov-meta' });
      console.log(JSON.stringify({ composition: label, entries: names, baseline: [baseline.raw, baseline.gzip, baseline.brotli, baseline.temporal, baseline.responsive], removed: [removed.raw, removed.gzip, removed.brotli, removed.temporal, removed.responsive] }));
    } catch (error) { console.log(JSON.stringify({ composition: label, error: String(error) })); }
  }
} else {
  const selected = process.argv.includes('--actual')
    ? cases.filter(([label]) => ['default', 'foundation-token', 'kanban', 'color-picker', 'kanban+color-picker'].includes(label))
    : cases;
  for (const [label, source, options] of selected) {
    try { console.log(JSON.stringify(await measure(label, source,
      process.argv.includes('--actual') ? { ...options, requireInternal: false } : options))); }
    catch (error) { console.log(JSON.stringify({ label, error: String(error) })); }
  }
}
