import { execFileSync, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const artifactPath = join(root, 'baselines/n2-visual/n2-023-bundle.json');
const update = process.argv.includes('--update');
const external = ['@angular/*', 'rxjs', 'rxjs/*'];
const git = existsSync('/opt/homebrew/bin/git') ? '/opt/homebrew/bin/git' : 'git';

const compressed = (bytes) => ({
  raw: bytes.byteLength,
  gzip: gzipSync(bytes, { level: 9 }).byteLength,
  brotli: brotliCompressSync(bytes, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).byteLength,
});

function packagePlugin(packageRoot) {
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  return {
    name: 'n2-visual-package',
    setup(api) {
      api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
        const suffix = path.slice('@neural-ui/core'.length);
        const entry = manifest.exports[suffix ? `.${suffix}` : '.'];
        const target = typeof entry === 'string' ? entry : (entry?.default ?? entry?.import);
        if (!target) throw new Error(`Missing package export for ${path}`);
        return { path: resolve(packageRoot, target), sideEffects: false };
      });
    },
  };
}

async function packageConsumer(packageRoot, source) {
  const result = await build({
    bundle: true,
    external,
    format: 'esm',
    metafile: true,
    minify: true,
    platform: 'browser',
    plugins: [packagePlugin(packageRoot)],
    stdin: { contents: source, loader: 'ts', resolveDir: root },
    treeShaking: true,
    write: false,
  });
  const output = result.outputFiles.find((file) => file.path.endsWith('<stdout>'));
  const bytes = output?.contents ?? Buffer.alloc(0);
  const attribution = Object.entries(result.metafile.outputs)
    .flatMap(([, value]) => Object.entries(value.inputs ?? {}))
    .map(([path, value]) => ({
      path: path.replace(/^.*?dist\/neural-ui\/core\//, 'dist/neural-ui/core/'),
      bytesInOutput: value.bytesInOutput,
    }))
    .filter((entry) => entry.bytesInOutput > 0)
    .sort((left, right) => right.bytesInOutput - left.bytesInOutput)
    .slice(0, 20);
  return { size: compressed(bytes), attribution };
}

function restoreHeadUiCore(workspace) {
  const target = join(workspace, 'projects/ui-core');
  rmSync(target, { recursive: true, force: true });
  const files = execFileSync(git, ['ls-tree', '-r', '--name-only', 'HEAD', 'projects/ui-core'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  for (const file of files) {
    const destination = join(target, relative('projects/ui-core', file));
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(
      destination,
      execFileSync(git, ['show', `HEAD:${file}`], {
        cwd: root,
        maxBuffer: 64 * 1024 * 1024,
      }),
    );
  }
}

function buildWorkspace(previous) {
  const workspace = mkdtempSync(join(root, '.n2-visual-bundle-'));
  try {
    for (const path of ['projects', 'angular.json', 'tsconfig.json', 'package.json', 'LICENSE'])
      cpSync(join(root, path), join(workspace, path), { recursive: true, dereference: true });
    if (previous) restoreHeadUiCore(workspace);
    const ng = join(root, 'node_modules/.bin/ng');
    const built = spawnSync(ng, ['build', 'ui-core', '--configuration', 'production'], {
      cwd: workspace,
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    });
    if (built.status !== 0) throw new Error(`${built.stdout}\n${built.stderr}`);
    return { workspace, packageRoot: join(workspace, 'dist/neural-ui/core') };
  } catch (error) {
    rmSync(workspace, { recursive: true, force: true });
    throw error;
  }
}

const sources = {
  basic: "import{NeuButtonComponent}from'@neural-ui/core/button';export{NeuButtonComponent};",
  full: [
    "import{NeuAlertComponent}from'@neural-ui/core/alert';",
    "import{NeuBadgeComponent}from'@neural-ui/core/badge';",
    "import{NeuButtonComponent}from'@neural-ui/core/button';",
    "import{NeuChipComponent}from'@neural-ui/core/chip';",
    "import{NeuCodeBlockComponent}from'@neural-ui/core/code-block';",
    "import{NeuEmptyStateComponent}from'@neural-ui/core/empty-state';",
    "import{NeuProgressBarComponent}from'@neural-ui/core/progress-bar';",
    "import{NeuSpinnerComponent}from'@neural-ui/core/spinner';",
    "import{NeuTagComponent}from'@neural-ui/core/tag';",
    "import{NeuTimelineComponent}from'@neural-ui/core/timeline';",
    "import{NeuTimelineGridComponent}from'@neural-ui/core/timeline-grid';",
    "import{NeuToolbarComponent}from'@neural-ui/core/toolbar';",
    'export{NeuAlertComponent,NeuBadgeComponent,NeuButtonComponent,NeuChipComponent,NeuCodeBlockComponent,NeuEmptyStateComponent,NeuProgressBarComponent,NeuSpinnerComponent,NeuTagComponent,NeuTimelineComponent,NeuTimelineGridComponent,NeuToolbarComponent};',
  ].join(''),
  'root-unused': "import{provideNeuralUI}from'@neural-ui/core';",
};

const candidate = buildWorkspace(false);
const previous = buildWorkspace(true);
try {
  const consumers = {};
  const previousConsumers = {};
  for (const [name, source] of Object.entries(sources)) {
    consumers[name] = await packageConsumer(candidate.packageRoot, source);
    previousConsumers[name] = await packageConsumer(previous.packageRoot, source);
  }
  if (consumers['root-unused'].size.raw !== 0) throw new Error('Root-unused is not zero bytes.');
  const comparison = Object.fromEntries(
    ['basic', 'full'].map((name) => [
      name,
      {
        rawDelta: consumers[name].size.raw - previousConsumers[name].size.raw,
        gzipDelta: consumers[name].size.gzip - previousConsumers[name].size.gzip,
        brotliDelta: consumers[name].size.brotli - previousConsumers[name].size.brotli,
      },
    ]),
  );
  const artifact = {
    checkpoint: 'N2-023',
    capturedAt: new Date().toISOString(),
    method: 'Angular-compiled minified consumer ESM; Angular/RxJS external; gzip 9; Brotli 11',
    previousConsumers,
    consumers,
    comparison,
  };
  if (update) {
    mkdirSync(dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
  }
  console.log(
    `N2-023 bundle passed: ${JSON.stringify({ previous: Object.fromEntries(Object.entries(previousConsumers).map(([name, value]) => [name, value.size])), current: Object.fromEntries(Object.entries(consumers).map(([name, value]) => [name, value.size])), comparison })}`,
  );
} finally {
  rmSync(candidate.workspace, { recursive: true, force: true });
  rmSync(previous.workspace, { recursive: true, force: true });
}
