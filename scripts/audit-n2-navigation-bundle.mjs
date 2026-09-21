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
const artifactPath = join(root, 'baselines/n2-navigation/n2-021-bundle.json');
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
    name: 'n2-navigation-package',
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
    .slice(0, 16);
  return { size: compressed(bytes), attribution };
}

function restoreHeadFamily(workspace) {
  for (const family of ['tabs', 'panel', 'sidebar']) {
    const prefix = `projects/ui-core/${family}`;
    const target = join(workspace, prefix);
    rmSync(target, { recursive: true, force: true });
    const files = execFileSync(git, ['ls-tree', '-r', '--name-only', 'HEAD', prefix], {
      cwd: root,
      encoding: 'utf8',
    })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    for (const file of files) {
      const destination = join(target, relative(prefix, file));
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, execFileSync(git, ['show', `HEAD:${file}`], { cwd: root }));
    }
  }
}

function buildWorkspace(legacy) {
  const workspace = mkdtempSync(join(root, '.n2-navigation-bundle-'));
  try {
    for (const path of ['projects', 'angular.json', 'tsconfig.json', 'package.json', 'LICENSE']) {
      cpSync(join(root, path), join(workspace, path), { recursive: true, dereference: true });
    }
    if (legacy) restoreHeadFamily(workspace);
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
  tabs: "import{NeuTabsComponent}from'@neural-ui/core/tabs';export{NeuTabsComponent};",
  panel: "import{NeuPanelComponent}from'@neural-ui/core/panel';export{NeuPanelComponent};",
  sidebar: "import{NeuSidebarComponent}from'@neural-ui/core/sidebar';export{NeuSidebarComponent};",
  combined: "import{NeuTabsComponent}from'@neural-ui/core/tabs';import{NeuPanelComponent}from'@neural-ui/core/panel';import{NeuSidebarComponent}from'@neural-ui/core/sidebar';export{NeuTabsComponent,NeuPanelComponent,NeuSidebarComponent};",
  'root-unused': "import{provideNeuralUI}from'@neural-ui/core';",
};
const candidate = buildWorkspace(false);
const legacy = buildWorkspace(true);

try {
  const consumers = {};
  const legacyConsumers = {};
  for (const [name, source] of Object.entries(sources)) {
    consumers[name] = await packageConsumer(candidate.packageRoot, source);
    legacyConsumers[name] = await packageConsumer(legacy.packageRoot, source);
  }
  if (consumers['root-unused'].size.raw !== 0) throw new Error('Root-unused is not zero bytes.');
  const graph = JSON.stringify(consumers);
  const forbidden = [
    '/table/neu-table',
    '/tree-table/neu-tree-table',
    '/table-core/',
    '@angular/common/http',
    '@angular/forms',
    'primeng',
  ].filter((token) => graph.includes(token));
  if (forbidden.length) throw new Error(`Forbidden graph tokens: ${forbidden.join(', ')}`);
  const comparison = Object.fromEntries(
    ['tabs', 'panel', 'sidebar', 'combined'].map((name) => [name, {
      rawDeltaPercent: ((consumers[name].size.raw - legacyConsumers[name].size.raw) / legacyConsumers[name].size.raw) * 100,
      gzipDeltaPercent: ((consumers[name].size.gzip - legacyConsumers[name].size.gzip) / legacyConsumers[name].size.gzip) * 100,
      brotliDeltaPercent: ((consumers[name].size.brotli - legacyConsumers[name].size.brotli) / legacyConsumers[name].size.brotli) * 100,
    }]),
  );
  const artifact = {
    checkpoint: 'N2-021',
    capturedAt: new Date().toISOString(),
    method: 'Angular-compiled minified consumer ESM; Angular/RxJS external; gzip 9; Brotli 11',
    legacyConsumers,
    consumers,
    comparison,
    forbiddenGraphTokens: forbidden,
    note: 'Sidebar overlay URL ownership is unchanged and belongs to the later overlay contract; collapsed state has no persistence owner.',
  };
  if (update) {
    mkdirSync(dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
    console.log(`Updated ${artifactPath}`);
  } else {
    if (!existsSync(artifactPath)) throw new Error('N2-021 bundle artifact is missing.');
    const stored = JSON.parse(readFileSync(artifactPath, 'utf8'));
    if (stored.checkpoint !== artifact.checkpoint) throw new Error('Unexpected checkpoint.');
    console.log(`N2-021 bundle passed: ${JSON.stringify(Object.fromEntries(Object.entries(consumers).map(([name, value]) => [name, value.size])))}`);
  }
} finally {
  rmSync(candidate.workspace, { recursive: true, force: true });
  rmSync(legacy.workspace, { recursive: true, force: true });
}
