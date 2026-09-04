import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const baselineArg = process.argv.find((argument) => argument.startsWith('--baseline='));
if (!baselineArg) throw new Error('Pass --baseline=/absolute/path/to/dist/neural-ui/core');

const packageRoots = {
  before: resolve(baselineArg.slice('--baseline='.length)),
  after: resolve(workspaceRoot, 'dist/neural-ui/core'),
};

const scenarios = {
  'data-view-basic': [['NeuDataViewComponent', 'data-view']],
  'data-view-remote': [['NeuDataViewComponent', 'data-view']],
  'fieldset-basic': [['NeuFieldsetComponent', 'panel']],
  'fieldset-collapsible': [['NeuFieldsetComponent', 'panel']],
  'dialog-basic': [['NeuDialogComponent', 'modal']],
  'dialog-advanced': [['NeuDialogComponent', 'modal']],
  'pagination-basic': [['NeuPaginationComponent', 'pagination']],
  'pagination-page-size': [['NeuPaginationComponent', 'pagination']],
  'menu-basic': [['NeuMenuComponent', 'menu']],
  'menu-controlled': [['NeuMenuComponent', 'menu']],
  'select-basic-overlay': [['NeuSelectComponent', 'select']],
  'select-overlay-policy': [
    ['NeuSelectComponent', 'select'],
    ['provideNeuOverlayDismissGuard', 'foundation', 'after-only'],
  ],
  'all-h9-b2-advanced': [
    ['NeuDataViewComponent', 'data-view'],
    ['NeuFieldsetComponent', 'panel'],
    ['NeuDialogComponent', 'modal'],
    ['NeuPaginationComponent', 'pagination'],
    ['NeuMenuComponent', 'menu'],
    ['provideNeuOverlayDismissGuard', 'foundation', 'after-only'],
  ],
};

function neuralPackagePlugin(packageRoot) {
  const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
  return {
    name: 'neural-package',
    setup(buildApi) {
      buildApi.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
        const suffix = path.slice('@neural-ui/core'.length);
        const exportKey = suffix ? `.${suffix}` : '.';
        const target = manifest.exports[exportKey]?.default;
        if (!target) throw new Error(`No export ${exportKey} in ${packageRoot}`);
        return { path: resolve(packageRoot, target) };
      });
    },
  };
}

async function measure(packageRoot, imports, phase) {
  const source = imports
    .filter(([, , availability]) => availability !== 'after-only' || phase === 'after')
    .map(([symbol, entrypoint], index) => {
      const local = `retained${index}`;
      return `import { ${symbol} as ${local} } from '@neural-ui/core/${entrypoint}'; export { ${local} };`;
    })
    .join('\n');
  const result = await build({
    bundle: true,
    external: ['@angular/*', '@angular/cdk/*', '@ng-icons/*', 'rxjs', 'rxjs/*'],
    format: 'esm',
    minify: true,
    platform: 'browser',
    plugins: [neuralPackagePlugin(packageRoot)],
    stdin: { contents: source, loader: 'js', resolveDir: workspaceRoot },
    treeShaking: true,
    write: false,
  });
  const bytes = Buffer.concat(result.outputFiles.map(({ contents }) => contents));
  return {
    raw: bytes.byteLength,
    gzip: gzipSync(bytes).byteLength,
    brotli: brotliCompressSync(bytes).byteLength,
  };
}

const rows = [];
for (const [scenario, imports] of Object.entries(scenarios)) {
  const before = await measure(packageRoots.before, imports, 'before');
  const after = await measure(packageRoots.after, imports, 'after');
  rows.push({
    scenario,
    beforeRaw: before.raw,
    afterRaw: after.raw,
    rawDelta: after.raw - before.raw,
    beforeBrotli: before.brotli,
    afterBrotli: after.brotli,
    brotliDelta: after.brotli - before.brotli,
    beforeGzip: before.gzip,
    afterGzip: after.gzip,
    gzipDelta: after.gzip - before.gzip,
  });
}

console.table(rows);
