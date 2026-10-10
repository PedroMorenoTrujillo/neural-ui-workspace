import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { packageExportTarget } from './lib/rel-01-package-bundle-evidence.mjs';

const root = resolve(import.meta.dirname, '..');
const packageRoot = resolve(root, 'dist/neural-ui/core');
const colorFesm = packageExportTarget(packageRoot, '@neural-ui/core/color-picker');
const original = readFileSync(colorFesm, 'utf8');
if (process.versions.node !== '22.22.3' || process.versions.zlib !== '1.2.12'
  || process.versions.brotli !== '1.2.0') throw new Error('Canonical REL-01E codec required');

function stubMethod(source, signature) {
  const start = source.indexOf(signature);
  if (start < 0) throw new Error(`Method not found: ${signature}`);
  const open = source.indexOf('{', start + signature.length);
  if (open < 0) throw new Error(`Method body not found: ${signature}`);
  let depth = 1;
  let close = open + 1;
  let quote = '';
  for (; close < source.length && depth; close++) {
    const ch = source[close];
    if (quote) {
      if (ch === '\\') close++;
      else if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
    else if (ch === '{') depth++;
    else if (ch === '}') depth--;
  }
  if (depth !== 0) throw new Error(`Unbalanced body: ${signature}`);
  return source.slice(0, open + 1) + source.slice(close - 1);
}

async function measure(label, contents) {
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
      name: 'rel-01e-color-virtual-bisection',
      setup(api) {
        api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => ({
          path: packageExportTarget(packageRoot, path), sideEffects: false,
        }));
        api.onLoad({ filter: /neural-ui-core-color-picker\.mjs$/ }, () => ({
          contents, loader: 'js', resolveDir: resolve(packageRoot, 'fesm2022'),
        }));
      },
    }],
    stdin: { contents: "import { NeuColorPickerComponent } from '@neural-ui/core/color-picker'; export { NeuColorPickerComponent };", loader: 'js', resolveDir: root },
    treeShaking: true,
    tsconfigRaw: { compilerOptions: {} },
    write: false,
  });
  const bytes = Buffer.concat(result.outputFiles.map((file) => file.contents));
  return { label, size: [bytes.length, gzipSync(bytes, { level: 9 }).length,
    brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length],
  eyedropper: bytes.includes(Buffer.from('EyeDropper')) };
}

const eyeMethod = stubMethod(original, 'async _sampleScreenColor()');
const eyeMethods = stubMethod(eyeMethod, 'cancelSampling()');
for (const [label, contents] of [
  ['real', original],
  ['diagnostic-stub-sampler', eyeMethod],
  ['diagnostic-stub-sampler-and-cancel', eyeMethods],
]) console.log(JSON.stringify(await measure(label, contents)));
