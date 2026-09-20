import { spawnSync } from 'node:child_process';
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
const update = process.argv.includes('--update');
const checkpoint = process.argv.includes('--checkpoint=N2-015C') ? 'N2-015C' : 'N2-015B';
const artifactStem = checkpoint === 'N2-015C' ? 'expansion-c' : 'hierarchy-b';
const artifactPath = join(root, `baselines/n2-tree-table/${artifactStem}-bundle.json`);
const graphPath = join(root, `baselines/n2-tree-table/${artifactStem}-dependency-graph.json`);
const temporary = mkdtempSync(join(root, '.n2-tree-table-bundle-'));
const external = ['@angular/*', 'rxjs', 'rxjs/*'];

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
    name: 'n2-tree-table-package',
    setup(api) {
      api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
        const suffix = path.slice('@neural-ui/core'.length);
        const target = manifest.exports[suffix ? `.${suffix}` : '.']?.default;
        if (!target) throw new Error(`Missing package export for ${path}`);
        return { path: resolve(packageRoot, target), sideEffects: false };
      });
    },
  };
}

function attribution(metafile) {
  const output = Object.values(metafile.outputs)[0];
  return Object.entries(output?.inputs ?? {})
    .map(([path, value]) => ({ path, bytesInOutput: value.bytesInOutput }))
    .filter((entry) => entry.bytesInOutput > 0)
    .sort((left, right) => right.bytesInOutput - left.bytesInOutput);
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
  const bytes = Buffer.concat(result.outputFiles.map((file) => file.contents));
  return {
    size: compressed(bytes),
    attribution: attribution(result.metafile).map((entry) => ({
      ...entry,
      path: entry.path.replace(/^.*?dist\/neural-ui\/core\//, 'dist/neural-ui/core/'),
    })),
  };
}

async function sourceGraph(source) {
  const result = await build({
    bundle: true,
    external,
    format: 'esm',
    loader: { '.html': 'text', '.scss': 'text' },
    metafile: true,
    minify: true,
    platform: 'browser',
    stdin: { contents: source, loader: 'ts', resolveDir: root },
    treeShaking: true,
    write: false,
  });
  return attribution(result.metafile).map((entry) => ({
    ...entry,
    path: entry.path.startsWith(root) ? relative(root, entry.path) : entry.path,
  }));
}

const basic =
  "import {NeuTreeTableComponent} from '@neural-ui/core/tree-table-next';export{NeuTreeTableComponent};";
const templates = "import * as candidate from '@neural-ui/core/tree-table-next';export{candidate};";
const sourceBasic =
  "import {NeuTreeTableComponent} from './projects/ui-core/tree-table/next/public/neu-tree-table.component-contract';export{NeuTreeTableComponent};";
const sourceTemplates =
  "import * as candidate from './projects/ui-core/tree-table/next/public/public-api';export{candidate};";

try {
  for (const path of ['projects', 'angular.json', 'tsconfig.json', 'package.json', 'LICENSE']) {
    cpSync(join(root, path), join(temporary, path), { recursive: true, dereference: true });
  }
  const entrypoint = join(temporary, 'projects/ui-core/tree-table-next');
  cpSync(join(temporary, 'projects/ui-core/tree-table/next'), entrypoint, {
    recursive: true,
    dereference: true,
  });
  mkdirSync(join(entrypoint, 'shared'), { recursive: true });
  cpSync(
    join(temporary, 'projects/ui-core/internal/neu-exact-key.ts'),
    join(entrypoint, 'shared/neu-exact-key.ts'),
  );
  cpSync(
    join(temporary, 'projects/ui-core/internal/neu-field-value-resolver.ts'),
    join(entrypoint, 'shared/neu-field-value-resolver.ts'),
  );
  const hierarchySource = join(entrypoint, 'internal/hierarchy/neu-tree-table-hierarchy.ts');
  writeFileSync(
    hierarchySource,
    readFileSync(hierarchySource, 'utf8').replace(
      '../../../../internal/neu-exact-key',
      '../../shared/neu-exact-key',
    ),
  );
  const rendererSource = join(entrypoint, 'internal/renderer/neu-tree-table-renderer.component.ts');
  writeFileSync(
    rendererSource,
    readFileSync(rendererSource, 'utf8')
      .replace(
        '../../../../internal/neu-field-value-resolver',
        '../../shared/neu-field-value-resolver',
      )
      .replace('../../../../internal/neu-exact-key', '../../shared/neu-exact-key'),
  );
  const interactionSource = join(entrypoint, 'internal/interaction/neu-tree-table-interaction.ts');
  writeFileSync(
    interactionSource,
    readFileSync(interactionSource, 'utf8').replace(
      '../../../../internal/neu-exact-key',
      '../../shared/neu-exact-key',
    ),
  );
  writeFileSync(join(entrypoint, 'public_api.ts'), "export * from './public/public-api';\n");
  writeFileSync(
    join(entrypoint, 'ng-package.json'),
    `${JSON.stringify({ lib: { entryFile: 'public_api.ts' } }, null, 2)}\n`,
  );
  const ng = join(root, 'node_modules/.bin/ng');
  const built = spawnSync(ng, ['build', 'ui-core', '--configuration', 'production'], {
    cwd: temporary,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  if (built.status !== 0) throw new Error(`${built.stdout}\n${built.stderr}`);
  const packageRoot = join(temporary, 'dist/neural-ui/core');
  const consumers = {
    basic: await packageConsumer(packageRoot, basic),
    ...(checkpoint === 'N2-015C'
      ? {
          'expansion-interaction': await packageConsumer(packageRoot, basic),
          'keyboard-focus': await packageConsumer(packageRoot, basic),
        }
      : {}),
    templates: await packageConsumer(packageRoot, templates),
    nested: await packageConsumer(packageRoot, basic),
    'root-unused': await packageConsumer(
      packageRoot,
      "import {provideNeuralUI} from '@neural-ui/core';",
    ),
  };
  const graph = {
    checkpoint,
    basic: await sourceGraph(sourceBasic),
    templates: await sourceGraph(sourceTemplates),
  };
  const graphText = JSON.stringify(graph);
  const forbidden = [
    '/table/neu-table',
    '/table-core/',
    '/tree-table/neu-tree-table.component',
    '@angular/forms',
    '@angular/router',
    '@angular/common/http',
    'primeng',
  ];
  const violations = forbidden.filter((token) => graphText.includes(token));
  const fesm = readFileSync(
    join(packageRoot, 'fesm2022/neural-ui-core-tree-table-next.mjs'),
    'utf8',
  );
  const imports = [
    ...new Set(
      [...fesm.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]),
    ),
  ].sort();
  const artifact = {
    checkpoint,
    legacyReference: { raw: 120_496, gzip: 18_411 },
    method: 'Angular-compiled minified ESM; Angular external; gzip 9; Brotli 11',
    consumers,
    packageImports: imports,
    forbiddenGraphTokens: violations,
  };
  if (consumers['root-unused'].size.raw !== 0) throw new Error('Root-unused is not zero bytes.');
  if (consumers.basic.size.raw <= 0 || consumers.templates.size.raw < consumers.basic.size.raw) {
    throw new Error('Invalid candidate bundle sizes.');
  }
  if (violations.length > 0) throw new Error(`Forbidden graph tokens: ${violations}`);
  if (!imports.every((name) => ['@angular/common', '@angular/core'].includes(name))) {
    throw new Error(`Unexpected candidate package imports: ${imports}`);
  }
  if (update) {
    mkdirSync(dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
    writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`);
    console.log(`Updated ${artifactPath}`);
    console.log(`Updated ${graphPath}`);
  } else {
    if (!existsSync(artifactPath) || !existsSync(graphPath)) {
      throw new Error(`${checkpoint} bundle artifacts missing; run with --update.`);
    }
    const stored = JSON.parse(readFileSync(artifactPath, 'utf8'));
    const storedGraph = JSON.parse(readFileSync(graphPath, 'utf8'));
    if (JSON.stringify(stored) !== JSON.stringify(artifact)) {
      throw new Error(`${checkpoint} bundle artifact drifted.`);
    }
    if (JSON.stringify(storedGraph) !== JSON.stringify(graph)) {
      throw new Error(`${checkpoint} dependency graph drifted.`);
    }
    console.log(
      `${checkpoint} bundle passed (basic ${artifact.consumers.basic.size.gzip} B gzip; templates ${artifact.consumers.templates.size.gzip} B gzip; root-unused 0 B).`,
    );
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
