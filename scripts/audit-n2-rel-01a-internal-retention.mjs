import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';

// Evidence only: virtual modules never touch the package, source, or dist.
const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = resolve(workspaceRoot, 'dist/neural-ui/core');
const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
const internal = readFileSync(resolve(packageRoot, 'fesm2022/neural-ui-core-internal.mjs'), 'utf8');
const idStart = internal.indexOf('class NeuIdGenerator {');
const idEnd = internal.indexOf('/** @internal Request/client hydration bridge', idStart);
if (idStart < 0 || idEnd < 0) throw new Error('Compiled NeuIdGenerator boundary changed');
const idClass = internal.slice(idStart, idEnd);
const idImports =
  "import * as i0 from '@angular/core';\nimport { Injectable } from '@angular/core';\n";
const idOnly = `${idImports}${idClass}\nexport { NeuIdGenerator };\n`;
const foundation = readFileSync(
  resolve(packageRoot, 'fesm2022/neural-ui-core-foundation.mjs'),
  'utf8',
).replace(/\/\/# sourceMappingURL=.*$/mu, '');
const foundationWithId = `${idImports}${foundation}\n${idClass}\nexport { NeuIdGenerator };\n`;

function size(bytes) {
  return {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };
}

async function probe(symbol, entrypoint, mode) {
  const result = await build({
    absWorkingDir: workspaceRoot,
    bundle: true,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'],
    format: 'esm',
    metafile: true,
    minify: true,
    platform: 'browser',
    plugins: [
      {
        name: 'rel-01a-virtual-boundary-probe',
        setup(api) {
          api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
            if (mode === 'id-only' && path === '@neural-ui/core/internal') {
              return { path: 'id-only', namespace: 'probe' };
            }
            if (mode === 'foundation-id' && path === '@neural-ui/core/foundation') {
              return { path: 'foundation-id', namespace: 'probe' };
            }
            const target = manifest.exports[`.${path.slice('@neural-ui/core'.length)}`]?.default;
            if (!target) throw new Error(`Missing package export: ${path}`);
            return { path: resolve(packageRoot, target), sideEffects: false };
          });
          api.onLoad({ filter: /.*/, namespace: 'probe' }, ({ path }) => ({
            contents: path === 'id-only' ? idOnly : foundationWithId,
            loader: 'js',
          }));
          if (mode === 'foundation-id') {
            api.onLoad({ filter: /neural-ui-core-(kanban|color-picker)\.mjs$/ }, ({ path }) => {
              const source = readFileSync(path, 'utf8');
              const fromInternal =
                /import \{ NeuIdGenerator \} from '@neural-ui\/core\/internal';/u;
              if (!fromInternal.test(source)) throw new Error(`Unexpected ID import in ${path}`);
              return {
                contents: source.replace(
                  fromInternal,
                  "import { NeuIdGenerator } from '@neural-ui/core/foundation';",
                ),
                loader: 'js',
              };
            });
          }
        },
      },
    ],
    stdin: {
      contents: `import { ${symbol} as retained0 } from '@neural-ui/core/${entrypoint}'; export { retained0 };`,
      loader: 'js',
      resolveDir: workspaceRoot,
    },
    treeShaking: true,
    tsconfigRaw: { compilerOptions: {} },
    write: false,
  });
  const bytes = Buffer.concat(result.outputFiles.map((file) => file.contents));
  const source = bytes.toString('utf8');
  const retained = Object.values(result.metafile.outputs)
    .flatMap((output) => Object.entries(output.inputs ?? {}))
    .filter(([path]) => path.endsWith('neural-ui-core-internal.mjs'))
    .reduce((total, [, input]) => total + input.bytesInOutput, 0);
  return {
    size: size(bytes),
    internalBytesInOutput: retained,
    temporalStateRetained: source.includes('neu-temporal-state'),
    responsiveStateRetained: source.includes('matchMedia'),
  };
}

const report = {};
for (const [name, symbol, entrypoint] of [
  ['kanban', 'NeuKanbanComponent', 'kanban'],
  ['color-picker-basic', 'NeuColorPickerComponent', 'color-picker'],
]) {
  report[name] = {};
  for (const mode of ['actual', 'id-only', 'foundation-id']) {
    report[name][mode] = await probe(symbol, entrypoint, mode);
  }
}
console.log(JSON.stringify(report, null, 2));
