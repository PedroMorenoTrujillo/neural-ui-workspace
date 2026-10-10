import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { assertPackageOnlyBundle, packageExportTarget } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = resolve(root, 'dist/neural-ui/core');
const capture = process.argv.find((value) => value.startsWith('--capture='))?.slice(10);
if (capture && !['before', 'after'].includes(capture)) throw new Error('Capture must be before or after');

const evidence = {
  environment: {
    node: process.versions.node,
    zlib: process.versions.zlib,
    brotli: process.versions.brotli ?? null,
    platform: process.platform,
    arch: process.arch,
  },
  scenarios: {},
};

for (const [name, specifier, symbol] of [
  ['kanban', '@neural-ui/core/kanban', 'NeuKanbanComponent'],
  ['color-picker', '@neural-ui/core/color-picker', 'NeuColorPickerComponent'],
]) {
  const source = `import { ${symbol} as retained0 } from '${specifier}'; export { retained0 };`;
  const result = await build({
    absWorkingDir: root,
    bundle: true,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'],
    format: 'esm',
    metafile: true,
    minify: true,
    platform: 'browser',
    plugins: [{
      name: 'rel-01c-package-only',
      setup(api) {
        api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => ({
          path: packageExportTarget(packageRoot, path),
          sideEffects: false,
        }));
      },
    }],
    stdin: { contents: source, loader: 'js', resolveDir: root },
    treeShaking: true,
    tsconfigRaw: { compilerOptions: {} },
    write: false,
  });
  assertPackageOnlyBundle(result.metafile, packageRoot, source, root);
  const bytes = Buffer.concat(result.outputFiles.map((file) => file.contents));
  const output = bytes.toString('utf8');
  const inputs = Object.entries(result.metafile.outputs)
    .flatMap(([, value]) => Object.entries(value.inputs ?? {}))
    .map(([input, value]) => ({
      path: input.replace(packageRoot + '/', ''),
      bytesInOutput: value.bytesInOutput,
    }));
  evidence.scenarios[name] = {
    size: {
      raw: bytes.length,
      gzip: gzipSync(bytes, { level: 9 }).length,
      brotli: brotliCompressSync(bytes, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
      }).length,
    },
    inputs,
    retained: {
      temporalStateKey: output.includes('neu-temporal-state'),
      responsiveMatchMedia: output.includes('matchMedia'),
    },
    metafile: result.metafile,
  };
}

if (capture) {
  writeFileSync(
    resolve(root, `baselines/n2-release/rel-01c-${capture}-metafiles.json`),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
}
console.log(JSON.stringify({
  environment: evidence.environment,
  scenarios: Object.fromEntries(Object.entries(evidence.scenarios).map(([name, value]) => [
    name,
    { size: value.size, inputs: value.inputs, retained: value.retained },
  ])),
}, null, 2));
