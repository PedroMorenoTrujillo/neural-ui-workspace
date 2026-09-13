import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const candidate = join(root, 'dist/neural-ui/core');
const temporary = mkdtempSync(join(root, '.n2-forms-baseline-'));
const baseline = join(temporary, 'dist/neural-ui/core');
const pilots = [
  'projects/ui-core/number-input/neu-number-input.component.ts',
  'projects/ui-core/knob/neu-knob.component.ts',
  'projects/ui-core/date-input/neu-date-input.component.ts',
  'projects/ui-core/date-input/public_api.ts',
  // The current table consumer is already migrated to the N2-005 inputDetail state.
  // Restore its matching baseline as well so the historical package compiles coherently.
  'projects/ui-core/table/neu-table-optional-features.component.ts',
  'projects/ui-core/table/neu-table-advanced-filter.utils.ts',
];
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
  for (const pilot of pilots) {
    let source = execFileSync('git', ['show', `HEAD:${pilot}`], { cwd: root, encoding: 'utf8' });
    // N2-002 began after the approved no-OnPush cleanup already present in the working tree.
    source = source
      .replace('  ChangeDetectionStrategy,\n', '')
      .replaceAll('  changeDetection: ChangeDetectionStrategy.OnPush,\n', '');
    writeFileSync(join(temporary, pilot), source);
  }
  const ng = join(root, 'node_modules/.bin/ng');
  const built = spawnSync(ng, ['build', 'ui-core', '--configuration', 'production'], {
    cwd: temporary,
    encoding: 'utf8',
  });
  if (built.status !== 0) {
    console.error(built.stdout);
    console.error(built.stderr);
    throw new Error(`Unable to build the N2-006 baseline (exit ${built.status ?? 1}).`);
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
export {FormControl,form,FormField,NeuTextareaComponent,NeuPasswordComponent,NeuInputMaskComponent,NeuInputOTPComponent,NeuSwitchComponent,NeuRadioGroupComponent,NeuRadioComponent,NeuNumberInputComponent,NeuKnobComponent,NeuDateInputComponent};`,
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
  for (const name of ['number-input', 'knob', 'date-input']) {
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
