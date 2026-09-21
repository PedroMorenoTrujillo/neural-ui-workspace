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
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const update = process.argv.includes('--update');
const checkpoint = process.argv.includes('--checkpoint=N2-011K')
  ? 'N2-011K'
  : process.argv.includes('--checkpoint=N2-015I')
  ? 'N2-015I'
  : process.argv.includes('--checkpoint=N2-015H')
    ? 'N2-015H'
    : process.argv.includes('--checkpoint=N2-015G')
    ? 'N2-015G'
  : process.argv.includes('--checkpoint=N2-015F')
    ? 'N2-015F'
    : process.argv.includes('--checkpoint=N2-015E')
      ? 'N2-015E'
      : process.argv.includes('--checkpoint=N2-015D')
        ? 'N2-015D'
        : process.argv.includes('--checkpoint=N2-015C')
          ? 'N2-015C'
          : 'N2-015B';
const artifactStem =
  checkpoint === 'N2-011K'
    ? 'physical-replacement-k'
    : checkpoint === 'N2-015I'
    ? 'final-certification-i'
    : checkpoint === 'N2-015H'
      ? 'final-features-h'
      : checkpoint === 'N2-015G'
      ? 'virtualization-g'
    : checkpoint === 'N2-015F'
      ? 'remote-f'
      : checkpoint === 'N2-015E'
        ? 'query-e'
        : checkpoint === 'N2-015D'
          ? 'selection-d'
          : checkpoint === 'N2-015C'
            ? 'expansion-c'
            : 'hierarchy-b';
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

const stableChunkName = (name) =>
  name.replace(/-[A-Za-z0-9_]{8,}-[A-Za-z0-9_]{8}\.js$/, '.js');

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

function attribution(metafile, outputNames = Object.keys(metafile.outputs).slice(0, 1)) {
  const totals = new Map();
  for (const outputName of outputNames) {
    for (const [path, value] of Object.entries(metafile.outputs[outputName]?.inputs ?? {})) {
      totals.set(path, (totals.get(path) ?? 0) + value.bytesInOutput);
    }
  }
  return [...totals]
    .map(([path, bytesInOutput]) => ({ path, bytesInOutput }))
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
    splitting: true,
    outdir: 'out',
    plugins: [packagePlugin(packageRoot)],
    stdin: { contents: source, loader: 'ts', resolveDir: root },
    treeShaking: true,
    write: false,
  });
  const entryOutput = Object.entries(result.metafile.outputs).find(
    ([, output]) => output.entryPoint !== undefined,
  )?.[0];
  if (entryOutput === undefined) throw new Error('Consumer entry output is missing.');
  const initial = new Set([entryOutput]);
  const pending = [entryOutput];
  while (pending.length > 0) {
    const outputName = pending.pop();
    if (outputName === undefined) continue;
    for (const dependency of result.metafile.outputs[outputName]?.imports ?? []) {
      if (dependency.kind === 'dynamic-import' || initial.has(dependency.path)) continue;
      initial.add(dependency.path);
      pending.push(dependency.path);
    }
  }
  const outputFile = (name) =>
    result.outputFiles.find((file) => file.path.endsWith(name.replace(/^out\//, '/out/')));
  const stableContents = (name) => {
    let content = Buffer.from(outputFile(name)?.contents ?? Buffer.alloc(0)).toString('utf8');
    for (const [index, outputName] of Object.keys(result.metafile.outputs).sort().entries()) {
      const original = basename(outputName);
      const stemLength = Math.max(0, original.length - 3);
      const prefix = `chunk-${index}`;
      const replacement = `${`${prefix}${'x'.repeat(stemLength)}`.slice(0, stemLength)}.js`;
      content = content.replaceAll(original, replacement);
    }
    return Buffer.from(content);
  };
  const bytes = Buffer.concat(
    [...initial].map((name) => stableContents(name)),
  );
  const chunks = Object.keys(result.metafile.outputs)
    .filter((name) => !initial.has(name))
    .map((name) => ({
      name: stableChunkName(name),
      size: compressed(stableContents(name)),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  return {
    size: compressed(bytes),
    chunks,
    attribution: attribution(result.metafile, [...initial]).map((entry) => ({
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
  "import {NeuTreeTableComponent} from '@neural-ui/core/tree-table';export{NeuTreeTableComponent};";
const templates = "import * as facade from '@neural-ui/core/tree-table';export{facade};";
const sourceBasic =
  "import {NeuTreeTableComponent} from './projects/ui-core/tree-table/public/neu-tree-table.component-contract';export{NeuTreeTableComponent};";
const sourceTemplates =
  "import * as facade from './projects/ui-core/tree-table/public/public-api';export{facade};";

try {
  for (const path of ['projects', 'angular.json', 'tsconfig.json', 'package.json', 'LICENSE']) {
    cpSync(join(root, path), join(temporary, path), { recursive: true, dereference: true });
  }
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
    ...(checkpoint === 'N2-015D'
      ? {
          selection: await packageConsumer(packageRoot, basic),
          'checkbox-propagation': await packageConsumer(packageRoot, basic),
          combined: await packageConsumer(packageRoot, templates),
        }
      : {}),
    ...(checkpoint === 'N2-015E'
      ? {
          search: await packageConsumer(packageRoot, basic),
          filter: await packageConsumer(packageRoot, basic),
          sort: await packageConsumer(packageRoot, basic),
          combined: await packageConsumer(packageRoot, templates),
        }
      : {}),
    ...(checkpoint === 'N2-015F'
      ? {
          'remote-roots': await packageConsumer(packageRoot, basic),
          'remote-children': await packageConsumer(packageRoot, basic),
          combined: await packageConsumer(packageRoot, templates),
        }
      : {}),
    ...(checkpoint === 'N2-015G'
      ? {
          'virtual-client': await packageConsumer(packageRoot, basic),
          'virtual-remote-loaded': await packageConsumer(packageRoot, basic),
          combined: await packageConsumer(packageRoot, templates),
        }
      : {}),
    ...(checkpoint === 'N2-015I' || checkpoint === 'N2-011K'
      ? {
          typical: await packageConsumer(packageRoot, templates),
          remote: await packageConsumer(packageRoot, basic),
          virtual: await packageConsumer(packageRoot, basic),
          editing: await packageConsumer(packageRoot, basic),
          'row-actions': await packageConsumer(packageRoot, basic),
          'export-csv': await packageConsumer(packageRoot, basic),
          'export-json': await packageConsumer(packageRoot, basic),
          'export-xlsx': await packageConsumer(packageRoot, basic),
          combined: await packageConsumer(packageRoot, templates),
        }
      : checkpoint === 'N2-015H'
      ? {
          editing: await packageConsumer(packageRoot, basic),
          'row-actions': await packageConsumer(packageRoot, basic),
          'export-csv': await packageConsumer(packageRoot, basic),
          'export-json': await packageConsumer(packageRoot, basic),
          'export-xlsx': await packageConsumer(packageRoot, basic),
          combined: await packageConsumer(packageRoot, templates),
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
    '@angular/router',
    '@angular/common/http',
    'primeng',
  ];
  const violations = forbidden.filter((token) => graphText.includes(token));
  const fesm = readFileSync(
    join(packageRoot, 'fesm2022/neural-ui-core-tree-table.mjs'),
    'utf8',
  );
  const imports = [
    ...new Set(
      [...fesm.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]),
    ),
  ]
    .map((name) =>
      name.startsWith('./neural-ui-core-tree-table-')
        ? './neural-ui-core-tree-table-private-chunk.mjs'
        : name,
    )
    .sort();
  const artifact = {
    checkpoint,
    legacyReference: { raw: 120_496, gzip: 18_411 },
    method: 'Angular-compiled minified ESM; Angular external; gzip 9; Brotli 11',
    consumers,
    packageImports: imports,
    optionalChunks: consumers.basic.chunks,
    forbiddenGraphTokens: violations,
    ...(checkpoint === 'N2-011K'
      ? (() => {
          const certified = JSON.parse(
            readFileSync(
              join(root, 'baselines/n2-tree-table/final-certification-i-bundle.json'),
              'utf8',
            ),
          ).consumers.basic.size;
          return {
            comparison: {
              finalIBasic: certified,
              physicalReplacementBasic: consumers.basic.size,
              rawDeltaPercent:
                ((consumers.basic.size.raw - certified.raw) / certified.raw) * 100,
              gzipDeltaPercent:
                ((consumers.basic.size.gzip - certified.gzip) / certified.gzip) * 100,
              brotliDeltaPercent:
                ((consumers.basic.size.brotli - certified.brotli) / certified.brotli) * 100,
            },
          };
        })()
      : {}),
  };
  if (consumers['root-unused'].size.raw !== 0) throw new Error('Root-unused is not zero bytes.');
  if (consumers.basic.size.raw <= 0 || consumers.templates.size.raw < consumers.basic.size.raw) {
    throw new Error('Invalid candidate bundle sizes.');
  }
  if (violations.length > 0) throw new Error(`Forbidden graph tokens: ${violations}`);
  if (
    checkpoint === 'N2-011K' &&
    (Math.abs(artifact.comparison.rawDeltaPercent) > 5 ||
      Math.abs(artifact.comparison.gzipDeltaPercent) > 5)
  ) {
    throw new Error('N2-011K TreeTable bundle changed more than 5% from N2-015I.');
  }
  if (
    !imports.every(
      (name) =>
        ['@angular/common', '@angular/core'].includes(name) ||
        name.startsWith('./neural-ui-core-tree-table-'),
    )
  ) {
    throw new Error(`Unexpected final package imports: ${imports}`);
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
