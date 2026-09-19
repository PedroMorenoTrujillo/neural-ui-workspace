import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const candidate = join(root, 'dist/neural-ui/core');
const temporary = mkdtempSync(join(root, '.n2-forms-baseline-'));
const baseline = join(temporary, 'dist/neural-ui/core');
const external = ['@angular/*', '@angular/cdk/*', '@ng-icons/*', 'rxjs', 'rxjs/*'];

function compressed(bytes) {
  return {
    raw: bytes.byteLength,
    gzip: gzipSync(bytes, { level: 9 }).byteLength,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).byteLength,
  };
}

function packagePlugin(packageRoot) {
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  return {
    name: 'n2-package',
    setup(api) {
      api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
        const suffix = path.slice('@neural-ui/core'.length);
        const target = manifest.exports[suffix ? `.${suffix}` : '.']?.default;
        return { path: resolve(packageRoot, target), sideEffects: false };
      });
    },
  };
}

async function consumer(packageRoot, source) {
  const result = await build({
    bundle: true,
    external,
    format: 'esm',
    minify: true,
    platform: 'browser',
    plugins: [packagePlugin(packageRoot)],
    stdin: { contents: source, loader: 'ts', resolveDir: root },
    treeShaking: true,
    write: false,
  });
  return compressed(Buffer.concat(result.outputFiles.map((file) => file.contents)));
}

function entry(packageRoot, name) {
  return compressed(readFileSync(join(packageRoot, 'fesm2022', `neural-ui-core-${name}.mjs`)));
}

function imports(packageRoot, name) {
  const source = readFileSync(join(packageRoot, 'fesm2022', `neural-ui-core-${name}.mjs`), 'utf8');
  return [
    ...new Set([...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((m) => m[1])),
  ].sort();
}

function delta(before, after) {
  return Object.fromEntries(Object.keys(before).map((key) => [key, after[key] - before[key]]));
}

try {
  for (const path of ['projects', 'angular.json', 'tsconfig.json', 'package.json', 'LICENSE']) {
    cpSync(join(root, path), join(temporary, path), { recursive: true, dereference: true });
  }
  const changed = execFileSync('git', ['diff', '--name-only', 'HEAD', '--', 'projects'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split('\n').filter(Boolean);
  for (const path of changed) {
    try {
      const source = execFileSync('git', ['show', `HEAD:${path}`], { cwd: root });
      mkdirSync(join(temporary, dirname(path)), { recursive: true });
      writeFileSync(join(temporary, path), source);
    } catch {
      rmSync(join(temporary, path), { recursive: true, force: true });
    }
  }
  const untracked = execFileSync(
    'git',
    ['ls-files', '--others', '--exclude-standard', '--', 'projects'],
    { cwd: root, encoding: 'utf8' },
  ).trim().split('\n').filter(Boolean);
  for (const path of untracked) {
    rmSync(join(temporary, path), { recursive: true, force: true });
  }
  const ng = join(root, 'node_modules/.bin/ng');
  const built = spawnSync(ng, ['build', 'ui-core', '--configuration', 'production'], {
    cwd: temporary,
    encoding: 'utf8',
  });
  if (built.status !== 0) {
    console.error(built.stdout);
    console.error(built.stderr);
    throw new Error(`Unable to build the N2-007 HEAD baseline (exit ${built.status ?? 1}).`);
  }

  const scenarios = {
    'root-unused': "import { provideNeuralUI } from '@neural-ui/core';",
    'number-input':
      "import {NeuNumberInputComponent} from '@neural-ui/core/number-input';export{NeuNumberInputComponent};",
    knob: "import {NeuKnobComponent} from '@neural-ui/core/knob';export{NeuKnobComponent};",
    'date-consumer':
      "import {NeuDateInputComponent} from '@neural-ui/core/date-input';export{NeuDateInputComponent};",
    'range-consumer':
      "import {NeuDateInputComponent} from '@neural-ui/core/date-input';const value={start:'2026-03-01',end:null};export{NeuDateInputComponent,value};",
    'multiple-consumer':
      "import {NeuDateInputComponent} from '@neural-ui/core/date-input';const value=['2026-03-01'];export{NeuDateInputComponent,value};",
    'select-single':
      "import {NeuSelectComponent} from '@neural-ui/core/select';const mode='single';export{NeuSelectComponent,mode};",
    'select-multiple':
      "import {NeuSelectComponent} from '@neural-ui/core/select';const mode='multiple';export{NeuSelectComponent,mode};",
    autocomplete:
      "import {NeuAutocompleteComponent} from '@neural-ui/core/autocomplete';export{NeuAutocompleteComponent};",
    'cascade-select':
      "import {NeuCascadeSelectComponent} from '@neural-ui/core/cascade-select';export{NeuCascadeSelectComponent};",
    listbox:
      "import {NeuListboxComponent} from '@neural-ui/core/listbox';export{NeuListboxComponent};",
    'toggle-button-group':
      "import {NeuToggleButtonGroupComponent} from '@neural-ui/core/toggle-button-group';export{NeuToggleButtonGroupComponent};",
    'input-tags-simple':
      "import {NeuInputTagsComponent} from '@neural-ui/core/input-tags';const value=['Angular'];export{NeuInputTagsComponent,value};",
    'input-tags-rich':
      "import {NeuInputTagsComponent} from '@neural-ui/core/input-tags';const options=[{id:1,label:'Angular'}],value=[1];export{NeuInputTagsComponent,options,value};",
    'input-tags-family': `import {NeuInputTagsComponent,NeuInputTagsItemDirective,NeuInputTagsOptionDirective} from '@neural-ui/core/input-tags';
const simple=['Angular'];const rich=[{id:1,label:'Angular'}];
export {NeuInputTagsComponent,NeuInputTagsItemDirective,NeuInputTagsOptionDirective,simple,rich};`,
    'inline-editor':
      "import {NeuInlineEditorComponent} from '@neural-ui/core/inline-editor';export{NeuInlineEditorComponent};",
    'color-picker':
      "import {NeuColorPickerComponent} from '@neural-ui/core/color-picker';export{NeuColorPickerComponent};",
    'rich-text-editor':
      "import {NeuRichTextEditorComponent} from '@neural-ui/core/rich-text-editor';export{NeuRichTextEditorComponent};",
    uploader:
      "import {NeuUploaderComponent} from '@neural-ui/core/uploader';export{NeuUploaderComponent};",
    slider:
      "import {NeuSliderComponent} from '@neural-ui/core/slider';export{NeuSliderComponent};",
    rating:
      "import {NeuRatingComponent} from '@neural-ui/core/rating';export{NeuRatingComponent};",
    'interaction-family': `import {NeuSliderComponent} from '@neural-ui/core/slider';
import {NeuRatingComponent} from '@neural-ui/core/rating';
export {NeuSliderComponent,NeuRatingComponent};`,
    'specialized-family': `import {NeuInlineEditorComponent} from '@neural-ui/core/inline-editor';
import {NeuColorPickerComponent} from '@neural-ui/core/color-picker';
import {NeuRichTextEditorComponent} from '@neural-ui/core/rich-text-editor';
import {NeuUploaderComponent} from '@neural-ui/core/uploader';
export {NeuInlineEditorComponent,NeuColorPickerComponent,NeuRichTextEditorComponent,NeuUploaderComponent};`,
    'selector-family': `import {NeuSelectComponent} from '@neural-ui/core/select';
import {NeuAutocompleteComponent} from '@neural-ui/core/autocomplete';
import {NeuCascadeSelectComponent} from '@neural-ui/core/cascade-select';
import {NeuListboxComponent} from '@neural-ui/core/listbox';
import {NeuToggleButtonGroupComponent} from '@neural-ui/core/toggle-button-group';
export {NeuSelectComponent,NeuAutocompleteComponent,NeuCascadeSelectComponent,NeuListboxComponent,NeuToggleButtonGroupComponent};`,
    'numeric-family': `import {NeuNumberInputComponent} from '@neural-ui/core/number-input';
import {NeuKnobComponent} from '@neural-ui/core/knob';
export {NeuNumberInputComponent,NeuKnobComponent};`,
    tree: "import { NeuTreeComponent } from '@neural-ui/core/tree'; export { NeuTreeComponent };",
    aggregate: `import {FormControl} from '@angular/forms';
import {form,FormField} from '@angular/forms/signals';
import {NeuTextareaComponent} from '@neural-ui/core/textarea';
import {NeuPasswordComponent} from '@neural-ui/core/password';
import {NeuInputMaskComponent} from '@neural-ui/core/input-mask';
import {NeuInputOTPComponent} from '@neural-ui/core/input-otp';
import {NeuSwitchComponent} from '@neural-ui/core/switch';
import {NeuRadioGroupComponent,NeuRadioComponent} from '@neural-ui/core/radio';
import {NeuNumberInputComponent} from '@neural-ui/core/number-input';
import {NeuKnobComponent} from '@neural-ui/core/knob';
import {NeuDateInputComponent} from '@neural-ui/core/date-input';
import {NeuSelectComponent} from '@neural-ui/core/select';
import {NeuAutocompleteComponent} from '@neural-ui/core/autocomplete';
import {NeuCascadeSelectComponent} from '@neural-ui/core/cascade-select';
import {NeuListboxComponent} from '@neural-ui/core/listbox';
import {NeuToggleButtonGroupComponent} from '@neural-ui/core/toggle-button-group';
import {NeuInputTagsComponent} from '@neural-ui/core/input-tags';
import {NeuInlineEditorComponent} from '@neural-ui/core/inline-editor';
import {NeuColorPickerComponent} from '@neural-ui/core/color-picker';
import {NeuRichTextEditorComponent} from '@neural-ui/core/rich-text-editor';
import {NeuUploaderComponent} from '@neural-ui/core/uploader';
import {NeuSliderComponent} from '@neural-ui/core/slider';
import {NeuRatingComponent} from '@neural-ui/core/rating';
export {FormControl,form,FormField,NeuTextareaComponent,NeuPasswordComponent,NeuInputMaskComponent,NeuInputOTPComponent,NeuSwitchComponent,NeuRadioGroupComponent,NeuRadioComponent,NeuNumberInputComponent,NeuKnobComponent,NeuDateInputComponent,NeuSelectComponent,NeuAutocompleteComponent,NeuCascadeSelectComponent,NeuListboxComponent,NeuToggleButtonGroupComponent,NeuInputTagsComponent,NeuInlineEditorComponent,NeuColorPickerComponent,NeuRichTextEditorComponent,NeuUploaderComponent,NeuSliderComponent,NeuRatingComponent};`,
  };
  const report = {
    method: 'minified ESM consumers; Angular/CDK/ng-icons/RxJS external; gzip 9; Brotli 11',
    baseline: {
      revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    },
    entries: {},
    consumers: {},
    imports: {},
    dependencies: {},
  };
  for (const name of ['number-input', 'knob', 'date-input', 'select', 'autocomplete', 'cascade-select', 'listbox', 'toggle-button-group', 'input-tags', 'inline-editor', 'color-picker', 'rich-text-editor', 'uploader', 'slider', 'rating']) {
    const before = entry(baseline, name);
    const after = entry(candidate, name);
    report.entries[name] = { before, after, delta: delta(before, after) };
    report.imports[name] = { before: imports(baseline, name), after: imports(candidate, name) };
  }
  for (const [name, source] of Object.entries(scenarios)) {
    const before = await consumer(baseline, source);
    const after = await consumer(candidate, source);
    report.consumers[name] = { before, after, delta: delta(before, after) };
  }
  report.dependencies = {
    before: JSON.parse(readFileSync(join(baseline, 'package.json'), 'utf8')).dependencies ?? {},
    after: JSON.parse(readFileSync(join(candidate, 'package.json'), 'utf8')).dependencies ?? {},
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.consumers['root-unused'].after.raw !== 0) process.exitCode = 1;
  if (JSON.stringify(report.dependencies.before) !== JSON.stringify(report.dependencies.after))
    process.exitCode = 1;
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
