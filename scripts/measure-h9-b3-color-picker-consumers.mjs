import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
};
const after = resolve(argument('--after') ?? 'dist/neural-ui/core');
const beforeArgument = argument('--before');
const before = beforeArgument ? resolve(beforeArgument) : undefined;
if (!existsSync(resolve(after, 'package.json'))) {
  throw new Error(`Missing final package at ${after}. Run the Library build first.`);
}
if (before && !existsSync(resolve(before, 'package.json'))) {
  throw new Error(`Missing baseline package at ${before}.`);
}

const scenarios = {
  basic: { mode: 'hex', showAlpha: false, showChannels: false },
  alpha: { mode: 'hex', showAlpha: true, showChannels: false },
  channels: { mode: 'rgb', showAlpha: false, showChannels: true },
  oklch: { mode: 'oklch', showAlpha: false, showChannels: false },
  fullAdvanced: { mode: 'oklch', showAlpha: true, showChannels: true },
};

function packagePlugin(root) {
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  return {
    name: 'neural-color-picker-package',
    setup(api) {
      api.onResolve({ filter: /^@neural-ui\/core\/color-picker$/ }, () => ({
        path: resolve(root, manifest.exports['./color-picker'].default),
      }));
    },
  };
}

async function measureConsumer(root) {
  const result = await build({
    bundle: true,
    external: ['@angular/*', '@angular/cdk/*', '@ng-icons/*', 'rxjs', 'rxjs/*'],
    format: 'esm',
    minify: true,
    platform: 'browser',
    plugins: [packagePlugin(root)],
    stdin: {
      contents:
        "import { NeuColorPickerComponent } from '@neural-ui/core/color-picker'; export { NeuColorPickerComponent };",
      loader: 'js',
    },
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

async function measurements(root) {
  const retained = await measureConsumer(root);
  return Object.fromEntries(
    Object.entries(scenarios).map(([name, bindings]) => [name, { bindings, ...retained }]),
  );
}

const finalMeasurements = await measurements(after);
const baselineMeasurements = before ? await measurements(before) : undefined;
const delta = baselineMeasurements
  ? Object.fromEntries(
      Object.keys(scenarios).map((name) => [
        name,
        Object.fromEntries(
          ['raw', 'gzip', 'brotli'].map((metric) => [
            metric,
            finalMeasurements[name][metric] - baselineMeasurements[name][metric],
          ]),
        ),
      ]),
    )
  : undefined;

console.log(
  JSON.stringify(
    {
      methodology:
        'Minified ESM consumer with Angular/CDK/RxJS external. Angular standalone component templates are retained atomically, so input bindings do not create separately tree-shakeable implementation paths.',
      baseline: baselineMeasurements,
      final: finalMeasurements,
      delta,
    },
    null,
    2,
  ),
);
