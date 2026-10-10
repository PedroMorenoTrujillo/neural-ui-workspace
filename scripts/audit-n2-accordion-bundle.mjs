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

import { assertPackageOnlyBundle, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const artifactPath = join(root, 'baselines/n2-accordion/n2-020-bundle.json');
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
    name: 'n2-accordion-package',
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
    stdin: { contents: source, loader: 'js', resolveDir: root },
    tsconfigRaw: { compilerOptions: {} },
    treeShaking: true,
    write: false,
  });
  assertPackageOnlyBundle(result.metafile, packageRoot, source);
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
    .slice(0, 12);
  return { size: compressed(bytes), attribution };
}

function restoreHeadAccordion(workspace) {
  const target = join(workspace, 'projects/ui-core/accordion');
  rmSync(target, { recursive: true, force: true });
  const files = execFileSync(
    git,
    ['ls-tree', '-r', '--name-only', 'HEAD', 'projects/ui-core/accordion'],
    { cwd: root, encoding: 'utf8' },
  )
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  for (const file of files) {
    const destination = join(target, relative('projects/ui-core/accordion', file));
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, execFileSync(git, ['show', `HEAD:${file}`], { cwd: root }));
  }
}

function buildWorkspace(headAccordion) {
  const workspace = mkdtempSync(join(root, '.n2-accordion-bundle-'));
  try {
    for (const path of ['projects', 'angular.json', 'tsconfig.json', 'package.json', 'LICENSE']) {
      cpSync(join(root, path), join(workspace, path), { recursive: true, dereference: true });
    }
    if (headAccordion) restoreHeadAccordion(workspace);
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

const basic =
  "import {NeuAccordionComponent} from '@neural-ui/core/accordion';export{NeuAccordionComponent};";
const facade = "import * as accordion from '@neural-ui/core/accordion';export{accordion};";
const rootUnused = "import {provideNeuralUI} from '@neural-ui/core';";
const candidate = buildWorkspace(false);
const legacy = buildWorkspace(true);

try {
  const consumers = {
    basic: await packageConsumer(candidate.packageRoot, basic),
    facade: await packageConsumer(candidate.packageRoot, facade),
    'root-unused': await packageConsumer(candidate.packageRoot, rootUnused),
  };
  const legacyBasic = await packageConsumer(legacy.packageRoot, basic);
  const graph = JSON.stringify(consumers.basic.attribution);
  const forbidden = [
    '/table/neu-table',
    '/tree-table/neu-tree-table',
    '/table-core/',
    '@angular/router',
    '@angular/common/http',
    '@angular/forms',
    'primeng',
  ].filter((token) => graph.includes(token));
  if (consumers['root-unused'].size.raw !== 0) throw new Error('Root-unused is not zero bytes.');
  if (forbidden.length) throw new Error(`Forbidden graph tokens: ${forbidden.join(', ')}`);
  const comparison = {
    rawDeltaPercent:
      ((consumers.basic.size.raw - legacyBasic.size.raw) / legacyBasic.size.raw) * 100,
    gzipDeltaPercent:
      ((consumers.basic.size.gzip - legacyBasic.size.gzip) / legacyBasic.size.gzip) * 100,
    brotliDeltaPercent:
      ((consumers.basic.size.brotli - legacyBasic.size.brotli) / legacyBasic.size.brotli) * 100,
  };
  const artifact = {
    checkpoint: 'N2-020',
    capturedAt: new Date().toISOString(),
    method: 'Angular-compiled minified consumer ESM; Angular/RxJS external; gzip 9; Brotli 11',
    legacyBasic,
    consumers,
    comparison,
    forbiddenGraphTokens: forbidden,
  };
  if (update) {
    mkdirSync(dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
    console.log(`Updated ${artifactPath}`);
  } else {
    if (!existsSync(artifactPath)) throw new Error('N2-020 bundle artifact is missing.');
    const stored = JSON.parse(readFileSync(artifactPath, 'utf8'));
    if (stored.checkpoint !== artifact.checkpoint) throw new Error('Unexpected checkpoint.');
    console.log(
      `N2-020 Accordion bundle passed (basic ${consumers.basic.size.gzip} B gzip; root-unused 0 B).`,
    );
  }
} finally {
  rmSync(candidate.workspace, { recursive: true, force: true });
  rmSync(legacy.workspace, { recursive: true, force: true });
}
