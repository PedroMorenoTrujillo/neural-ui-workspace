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
const artifactPath = join(root, 'baselines/n2-table/query-ui-e-bundle.json');
const graphPath = join(root, 'baselines/n2-table/query-ui-e-dependency-graph.json');
const baselinePath = join(root, 'baselines/n2-table/layout-selection-d-bundle.json');
const temporary = mkdtempSync(join(root, '.n2-table-query-ui-'));
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

function stableBytes(bytes) {
  return Buffer.from(
    Buffer.from(bytes)
      .toString('utf8')
      .replace(
        /neural-ui-core-table-next-neu-table-advanced-filter-builder\.component-[A-Za-z0-9_-]+\.js/g,
        'neu-table-advanced-filter-builder.component.js',
      )
      .replace(/chunk-[A-Za-z0-9_-]+\.js/g, 'chunk-shared-core.js'),
  );
}

function attribution(output) {
  return Object.entries(output?.inputs ?? {})
    .map(([path, value]) => ({ path, bytesInOutput: value.bytesInOutput }))
    .filter((entry) => entry.bytesInOutput > 0)
    .sort((left, right) => right.bytesInOutput - left.bytesInOutput);
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

async function bundle(options) {
  const result = await build({
    bundle: true,
    external,
    format: 'esm',
    loader: options.sourceMode ? { '.html': 'text', '.scss': 'text' } : undefined,
    metafile: true,
    minify: true,
    outdir: 'out',
    platform: 'browser',
    plugins: options.packageRoot ? [packagePlugin(options.packageRoot)] : [],
    stdin: { contents: options.source, loader: options.packageRoot ? 'js' : 'ts', resolveDir: root },
    tsconfigRaw: options.packageRoot ? { compilerOptions: {} } : undefined,
    splitting: true,
    treeShaking: true,
    write: false,
  });
  if (options.packageRoot) assertPackageOnlyBundle(result.metafile, options.packageRoot, options.source);
  const [entryPath, entryOutput] =
    Object.entries(result.metafile.outputs).find(([, output]) => output.entryPoint !== undefined) ??
    [];
  if (entryPath === undefined || entryOutput === undefined) {
    throw new Error('Bundle entry output is missing.');
  }
  const entryFile = result.outputFiles.find((file) => file.path.endsWith(entryPath));
  if (entryFile === undefined) throw new Error(`Bundle entry bytes are missing: ${entryPath}`);
  const chunkFiles = result.outputFiles.filter((file) => file !== entryFile);
  const chunks = chunkFiles.map((file) => ({
    kind: file.path.includes('advanced-filter-builder') ? 'advanced-builder' : 'shared-core',
    size: compressed(stableBytes(file.contents)),
  }));
  const lazyChunkFiles = chunkFiles.filter((file) => file.path.includes('advanced-filter-builder'));
  const initialBytes = Buffer.concat([
    stableBytes(entryFile.contents),
    ...chunkFiles
      .filter((file) => !lazyChunkFiles.includes(file))
      .map((file) => stableBytes(file.contents)),
  ]);
  return {
    size: compressed(initialBytes),
    entrySize: compressed(stableBytes(entryFile.contents)),
    chunks,
    lazyChunks: lazyChunkFiles.map((file) => ({
      kind: 'advanced-builder',
      size: compressed(stableBytes(file.contents)),
    })),
    attribution: attribution(entryOutput).map((entry) => ({
      ...entry,
      path: entry.path.startsWith(root) ? relative(root, entry.path) : entry.path,
    })),
  };
}

function packageImports(packageRoot) {
  const source = readFileSync(join(packageRoot, 'fesm2022/neural-ui-core-table-next.mjs'), 'utf8');
  return [
    ...new Set(
      [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]),
    ),
  ].sort();
}

const component = "import{NeuTableComponent}from'@neural-ui/core/table-next';";
const scenarios = {
  basic: `${component}export{NeuTableComponent};`,
  sort: `${component}const sortOptions={mode:'multiple',removable:true,defaultDirection:'asc',resetPageOnChange:true};export{NeuTableComponent,sortOptions};`,
  pagination: `${component}const paginationOptions={enabled:true,pageSizeOptions:[10,25,50],position:'bottom',report:'range',showPageJump:true};export{NeuTableComponent,paginationOptions};`,
  simpleFilters: `${component}const filterOptions={surfaces:['row','menu'],globalFields:['name'],predicates:{},debounceMs:0,commit:'explicit'};export{NeuTableComponent,filterOptions};`,
  advancedFilters: `${component}const filterOptions={surfaces:['builder'],globalFields:[],predicates:{},debounceMs:0,commit:'explicit'};export{NeuTableComponent,filterOptions};`,
  combined: `${component}const options={sort:{mode:'multiple',removable:true,defaultDirection:'asc',resetPageOnChange:true},filter:{surfaces:['row','menu','builder'],globalFields:['name'],predicates:{},debounceMs:50,commit:'explicit'},pagination:{enabled:true,pageSizeOptions:[10,25,50],position:'both',report:'range',showPageJump:true}};export{NeuTableComponent,options};`,
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
        await bundle({ packageRoot, source }),
      ]),
    ),
  );
  consumers['root-unused'] = await bundle({
    packageRoot,
    source: "import{provideNeuralUI}from'@neural-ui/core';",
  });
  const sourceComponent = await bundle({
    sourceMode: true,
    source:
      "import{NeuTableComponent}from'./projects/ui-core/table/public/neu-table.component-contract';export{NeuTableComponent};",
  });
  const isolated = {
    queryTransitions: await bundle({
      sourceMode: true,
      source:
        "export * from './projects/ui-core/table/internal/query-ui/neu-table-query-transitions';",
    }),
    advancedBuilder: await bundle({
      sourceMode: true,
      source:
        "export{NeuTableAdvancedFilterBuilderComponent}from'./projects/ui-core/table/internal/features/advanced-filters/neu-table-advanced-filter-builder.component';",
    }),
  };
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const imports = packageImports(packageRoot).map((name) =>
    name.startsWith('./neural-ui-core-table-next-') ? './<private-feature-chunk>' : name,
  );
  const forbidden = [
    '/table/neu-table.component',
    '/table-core/',
    '@angular/forms',
    '@angular/router',
    '@angular/cdk',
    '@ng-icons',
  ].filter((token) => JSON.stringify(sourceComponent).includes(token));
  const graph = { checkpoint: 'N2-011E', sourceComponent, isolated };
  const artifact = {
    checkpoint: 'N2-011E',
    method: 'Angular-compiled minified ESM; Angular dependencies external; gzip 9; Brotli 11',
    consumers,
    comparison: {
      layoutSelectionDBasic: baseline.consumers.basic.size,
      queryUiEBasic: consumers.basic.size,
      basicGzipDelta: consumers.basic.size.gzip - baseline.consumers.basic.size.gzip,
      layoutSelectionDCombined: baseline.consumers.combined.size,
      queryUiECombined: consumers.combined.size,
      combinedGzipDelta: consumers.combined.size.gzip - baseline.consumers.combined.size.gzip,
    },
    isolated,
    packageImports: imports,
    forbiddenGraphTokens: forbidden,
    classification: {
      core: ['controlled query proposal helpers', 'sort/search/simple-filter/pagination controls'],
      optionalSplittable: ['row/menu filter presentation'],
      dynamicCandidate: ['advanced filter builder'],
      notWorthSplitting: ['small pure query transforms and equality'],
    },
  };
  if (consumers['root-unused'].size.raw !== 0) throw new Error('Root-unused is not zero bytes.');
  if (forbidden.length > 0) throw new Error(`Forbidden dependency graph tokens: ${forbidden}`);
  if (
    !imports.every(
      (name) =>
        ['@angular/common', '@angular/core'].includes(name) || name === './<private-feature-chunk>',
    )
  ) {
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
      throw new Error('N2-011E bundle artifacts are missing; run with --update.');
    }
    const stored = JSON.parse(readFileSync(artifactPath, 'utf8'));
    if (stored.checkpoint !== 'N2-011E') throw new Error('Unexpected N2-011E bundle checkpoint.');
    for (const [name, consumer] of Object.entries(consumers)) {
      const baseline = stored.consumers[name]?.size;
      if (
        baseline === undefined ||
        Math.abs(consumer.size.raw - baseline.raw) > 256 ||
        Math.abs(consumer.size.gzip - baseline.gzip) > 64 ||
        Math.abs(consumer.size.brotli - baseline.brotli) > 64
      ) {
        throw new Error(`N2-011E bundle scenario drifted: ${name}`);
      }
    }
    const storedGraph = JSON.parse(readFileSync(graphPath, 'utf8'));
    if (storedGraph.checkpoint !== 'N2-011E' || stored.forbiddenGraphTokens.length > 0) {
      throw new Error('N2-011E dependency graph baseline is invalid.');
    }
    console.log(
      `N2-011E bundle passed (basic ${consumers.basic.size.gzip} B gzip; combined ${consumers.combined.size.gzip} B gzip; advanced isolated ${isolated.advancedBuilder.size.gzip} B gzip; root-unused 0 B).`,
    );
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
