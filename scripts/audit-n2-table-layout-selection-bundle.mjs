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

import { assertPackageOnlyBundle, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const update = process.argv.includes('--update');
const artifactPath = join(root, 'baselines/n2-table/layout-selection-d-bundle.json');
const graphPath = join(root, 'baselines/n2-table/layout-selection-d-dependency-graph.json');
const clientArtifactPath = join(root, 'baselines/n2-table/client-c-bundle.json');
const clientGraphPath = join(root, 'baselines/n2-table/client-c-dependency-graph.json');
const temporary = mkdtempSync(join(root, '.n2-table-layout-selection-'));
const external = ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'];

function compressed(bytes) {
  return {
    raw: bytes.byteLength,
    gzip: gzipSync(bytes, { level: 9 }).byteLength,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).byteLength,
  };
}

function packagePlugin(packageRoot) {
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  return {
    name: 'n2-table-package',
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
    stdin: { contents: source, loader: 'js', resolveDir: root },
    tsconfigRaw: { compilerOptions: {} },
    treeShaking: true,
    write: false,
  });
  assertPackageOnlyBundle(result.metafile, packageRoot, source);
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

async function sourceBundle(source) {
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
  const bytes = Buffer.concat(result.outputFiles.map((file) => file.contents));
  return { size: compressed(bytes), attribution: attribution(result.metafile) };
}

function graphDelta(current, baseline) {
  const baselineByPath = new Map(baseline.map((entry) => [entry.path, entry.bytesInOutput]));
  const currentByPath = new Map(current.map((entry) => [entry.path, entry.bytesInOutput]));
  return [...new Set([...baselineByPath.keys(), ...currentByPath.keys()])]
    .map((path) => ({
      path,
      bytesInOutput: (currentByPath.get(path) ?? 0) - (baselineByPath.get(path) ?? 0),
    }))
    .filter((entry) => entry.bytesInOutput !== 0)
    .sort((left, right) => Math.abs(right.bytesInOutput) - Math.abs(left.bytesInOutput));
}

function packageImports(packageRoot) {
  const source = readFileSync(join(packageRoot, 'fesm2022/neural-ui-core-table-next.mjs'), 'utf8');
  return [
    ...new Set(
      [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]),
    ),
  ].sort();
}

const component = "import {NeuTableComponent} from '@neural-ui/core/table-next';";
const scenarios = {
  basic: `${component}export{NeuTableComponent};`,
  keys: `${component}const selection={kind:'keys',keys:[1,2]};export{NeuTableComponent,selection};`,
  allMatching: `${component}const selection={kind:'all-matching',scope:{search:'a',filters:null,globalFields:['name']},excludedKeys:[2]};export{NeuTableComponent,selection};`,
  layout: `${component}const layout={order:['name','id'],hidden:[],widths:{name:240},pinnedStart:['name'],pinnedEnd:[]};export{NeuTableComponent,layout};`,
  combined: `${component}const config={selection:{kind:'keys',keys:[1]},layout:{order:['name','id'],hidden:[],widths:{name:240},pinnedStart:['name'],pinnedEnd:[]}};export{NeuTableComponent,config};`,
};
const sourceComponent =
  "import {NeuTableComponent} from './projects/ui-core/table/public/neu-table.component-contract';export{NeuTableComponent};";
const sourceAll =
  "import * as candidate from './projects/ui-core/table/public/public-api';export{candidate};";
const selectionModule = './projects/ui-core/table/internal/selection/neu-table-selection';
const layoutModule = './projects/ui-core/table/internal/layout/neu-table-layout';
const featureSources = {
  selectionPureEngine: `export * from '${selectionModule}';`,
  allMatchingSupport: `export {
    createNeuTableSelectionScope,areNeuTableSelectionScopesEqual,neuTableRowMatchesSelectionScope
  } from '${selectionModule}';`,
  rangeModifierSelection: `export {proposeNeuTableRowSelection} from '${selectionModule}';`,
  headerSelection: `export {
    projectNeuTableSelection,proposeNeuTableToggleAll
  } from '${selectionModule}';`,
  layoutProjection: `export {
    normalizeNeuTableColumns,projectNeuTableLayout
  } from '${layoutModule}';`,
  resizeInteractionPure: `export {
    normalizeNeuTableResize,proposeNeuTableResize
  } from '${layoutModule}';`,
  reorderInteractionPure: `export {
    proposeNeuTableReorder,proposeNeuTableMove
  } from '${layoutModule}';`,
  pinningPure: `export {proposeNeuTablePin} from '${layoutModule}';`,
};

try {
  for (const path of ['projects', 'angular.json', 'tsconfig.json', 'package.json', 'LICENSE']) {
    cpSync(join(root, path), join(temporary, path), { recursive: true, dereference: true });
  }
  cpSync(
    join(temporary, 'projects/ui-core/table'),
    join(temporary, 'projects/ui-core/table-next'),
    { recursive: true, dereference: true },
  );
  writeFileSync(
    join(temporary, 'projects/ui-core/table-next/public_api.ts'),
    "export * from './public/public-api';\n",
  );
  writeFileSync(
    join(temporary, 'projects/ui-core/table-next/ng-package.json'),
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
  const consumers = Object.fromEntries(
    await Promise.all(
      Object.entries(scenarios).map(async ([name, source]) => [
        name,
        await packageConsumer(packageRoot, source),
      ]),
    ),
  );
  consumers['root-unused'] = await packageConsumer(
    packageRoot,
    "import {provideNeuralUI} from '@neural-ui/core';",
  );
  const graph = {
    checkpoint: 'N2-011D',
    component: await sourceGraph(sourceComponent),
    completeEntrypoint: await sourceGraph(sourceAll),
  };
  const isolatedFeatureBundles = Object.fromEntries(
    await Promise.all(
      Object.entries(featureSources).map(async ([name, source]) => [
        name,
        await sourceBundle(source),
      ]),
    ),
  );
  const clientArtifact = JSON.parse(readFileSync(clientArtifactPath, 'utf8'));
  const clientGraph = JSON.parse(readFileSync(clientGraphPath, 'utf8'));
  if (clientArtifact.checkpoint !== 'N2-011C' || clientGraph.checkpoint !== 'N2-011C') {
    throw new Error('N2-011C comparison artifacts are not the frozen client baseline.');
  }
  const sourceContributionDelta = graphDelta(graph.component, clientGraph.queryClientBasic);
  const sourceContributionRaw = sourceContributionDelta.reduce(
    (total, entry) => total + entry.bytesInOutput,
    0,
  );
  const compiledModuleRawDelta =
    consumers.basic.attribution[0].bytesInOutput -
    clientArtifact.consumers.queryClientBasic.attribution[0].bytesInOutput;
  const forbidden = [
    '/table/neu-table.component',
    '/table-core/',
    '@angular/forms',
    '@angular/router',
    '@angular/cdk',
    '@ng-icons',
  ];
  const violations = forbidden.filter((token) => JSON.stringify(graph).includes(token));
  const imports = packageImports(packageRoot);
  const artifact = {
    checkpoint: 'N2-011D',
    method: 'Angular-compiled minified ESM; Angular dependencies external; gzip 9; Brotli 11',
    consumers,
    packageImports: imports,
    forbiddenGraphTokens: violations,
    retention: {
      comparison: {
        clientCBasic: clientArtifact.consumers.queryClientBasic.size,
        clientCCombined: clientArtifact.consumers.queryCombined.size,
        layoutSelectionDBasic: consumers.basic.size,
        basicToBasicGzipDelta:
          consumers.basic.size.gzip - clientArtifact.consumers.queryClientBasic.size.gzip,
        combinedToBasicGzipDelta:
          consumers.basic.size.gzip - clientArtifact.consumers.queryCombined.size.gzip,
        compiledModuleRawDelta,
      },
      sourceContributionDelta,
      sourceContributionRaw,
      templateStylesAndAngularCompilationRemainderRaw:
        compiledModuleRawDelta - sourceContributionRaw,
      isolatedFeatureBundles,
      note: 'Isolated feature bundles overlap through shared helpers and are non-additive; template-bound component methods remain reachable as one compiled Angular definition.',
    },
  };

  if (consumers['root-unused'].size.raw !== 0) throw new Error('Root-unused is not zero bytes.');
  if (
    Object.entries(consumers).some(([name, value]) => name !== 'root-unused' && value.size.raw <= 0)
  ) {
    throw new Error('An N2-011D consumer bundle is empty.');
  }
  if (violations.length > 0) throw new Error(`Forbidden dependency graph tokens: ${violations}`);
  if (!imports.every((name) => ['@angular/common', '@angular/core'].includes(name))) {
    throw new Error(`Unexpected table package imports: ${imports}`);
  }

  if (update) {
    mkdirSync(dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
    writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`);
    console.log(`Updated ${artifactPath}`);
    console.log(`Updated ${graphPath}`);
  } else {
    if (!existsSync(artifactPath) || !existsSync(graphPath)) {
      throw new Error('N2-011D bundle artifacts are missing; run with --update.');
    }
    if (
      JSON.stringify(JSON.parse(readFileSync(artifactPath, 'utf8'))) !== JSON.stringify(artifact)
    ) {
      throw new Error('N2-011D bundle artifact drifted.');
    }
    if (JSON.stringify(JSON.parse(readFileSync(graphPath, 'utf8'))) !== JSON.stringify(graph)) {
      throw new Error('N2-011D dependency graph drifted.');
    }
    console.log(
      `N2-011D bundle passed (basic ${consumers.basic.size.gzip} B gzip; +${artifact.retention.comparison.combinedToBasicGzipDelta} B vs C combined; combined ${consumers.combined.size.gzip} B gzip; root-unused 0 B).`,
    );
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
