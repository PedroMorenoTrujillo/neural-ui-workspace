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
const artifactPath = join(root, 'baselines/n2-table/virtualization-g-bundle.json');
const graphPath = join(root, 'baselines/n2-table/virtualization-g-dependency-graph.json');
const baselinePath = join(root, 'baselines/n2-table/remote-f-bundle.json');
const temporary = mkdtempSync(join(root, '.n2-table-virtualization-'));
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
    .map(([path, value]) => ({
      path: path.startsWith(root) ? relative(root, path) : path,
      bytesInOutput: value.bytesInOutput,
    }))
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

async function bundle({ packageRoot, source, sourceMode = false }) {
  const result = await build({
    bundle: true,
    external,
    format: 'esm',
    loader: sourceMode ? { '.html': 'text', '.scss': 'text' } : undefined,
    metafile: true,
    minify: true,
    outdir: 'out',
    platform: 'browser',
    plugins: packageRoot ? [packagePlugin(packageRoot)] : [],
    stdin: { contents: source, loader: 'ts', resolveDir: root },
    splitting: true,
    treeShaking: true,
    write: false,
  });
  const [entryPath, entryOutput] =
    Object.entries(result.metafile.outputs).find(([, output]) => output.entryPoint !== undefined) ??
    [];
  if (entryPath === undefined || entryOutput === undefined)
    throw new Error('Missing entry output.');
  const entryFile = result.outputFiles.find((file) => file.path.endsWith(entryPath));
  if (entryFile === undefined) throw new Error('Missing entry bytes.');
  const chunks = result.outputFiles.filter((file) => file !== entryFile);
  const initialChunks = chunks.filter((file) => !file.path.includes('advanced-filter-builder'));
  const bytes = Buffer.concat([
    stableBytes(entryFile.contents),
    ...initialChunks.map((file) => stableBytes(file.contents)),
  ]);
  return {
    size: compressed(bytes),
    entrySize: compressed(stableBytes(entryFile.contents)),
    chunks: chunks.map((file) => ({
      kind: file.path.includes('advanced-filter-builder') ? 'advanced-builder' : 'shared-core',
      size: compressed(stableBytes(file.contents)),
    })),
    attribution: attribution(entryOutput),
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
  basic: `${component}const options={dataMode:'client'};export{NeuTableComponent,options};`,
  clientVirtual: `${component}const options={dataMode:'client',virtualization:{enabled:true,itemSize:32,overscan:4,requestStep:50}};export{NeuTableComponent,options};`,
  remoteVirtual: `${component}const options={dataMode:'remote',virtualization:{enabled:true,itemSize:32,overscan:4,requestStep:50},metadata:{totalItems:1000000,dataRange:{start:0,end:50}}};export{NeuTableComponent,options};`,
  combined: `${component}const options={dataMode:'remote',virtualization:{enabled:true,itemSize:32,overscan:4,requestStep:50},sort:{mode:'multiple',removable:true,defaultDirection:'asc',resetPageOnChange:true},filter:{surfaces:['row','menu','builder'],globalFields:['name'],predicates:{},debounceMs:50,commit:'explicit'},selection:{mode:'multiple',indicator:'checkbox',selectOnRowClick:true,modifier:'toggle',range:true,toggleAllScope:'all-matching'}};export{NeuTableComponent,options};`,
};

try {
  for (const path of ['projects', 'angular.json', 'tsconfig.json', 'package.json', 'LICENSE']) {
    cpSync(join(root, path), join(temporary, path), { recursive: true, dereference: true });
  }
  cpSync(
    join(temporary, 'projects/ui-core/table'),
    join(temporary, 'projects/ui-core/table-next'),
    {
      recursive: true,
      dereference: true,
    },
  );
  writeFileSync(
    join(temporary, 'projects/ui-core/table-next/public_api.ts'),
    "export * from './public/public-api';\n",
  );
  writeFileSync(
    join(temporary, 'projects/ui-core/table-next/ng-package.json'),
    `${JSON.stringify({ lib: { entryFile: 'public_api.ts' } }, null, 2)}\n`,
  );
  const built = spawnSync(
    join(root, 'node_modules/.bin/ng'),
    ['build', 'ui-core', '--configuration', 'production'],
    {
      cwd: temporary,
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    },
  );
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
    virtualizationEngine: await bundle({
      sourceMode: true,
      source:
        "export * from './projects/ui-core/table/internal/virtualization/neu-table-virtualization';",
    }),
    remoteCoordinator: await bundle({
      sourceMode: true,
      source:
        "export * from './projects/ui-core/table/internal/remote/neu-table-remote-coordinator';",
    }),
  };
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const imports = packageImports(packageRoot).map((name) =>
    name.startsWith('./neural-ui-core-table-next-') ? './<private-feature-chunk>' : name,
  );
  const forbidden = [
    '/table/neu-table.component',
    '/table-core/',
    '@angular/common/http',
    '@angular/forms',
    '@angular/router',
    '@angular/cdk',
    '@ng-icons',
  ].filter((token) => JSON.stringify(sourceComponent).includes(token));
  const artifact = {
    checkpoint: 'N2-011G',
    method: 'Angular-compiled minified ESM; Angular dependencies external; gzip 9; Brotli 11',
    consumers,
    comparison: {
      remoteFClientBasic: baseline.consumers.clientBasic.size,
      virtualizationGBasic: consumers.basic.size,
      basicGzipDelta: consumers.basic.size.gzip - baseline.consumers.clientBasic.size.gzip,
      remoteFCombined: baseline.consumers.combined.size,
      virtualizationGCombined: consumers.combined.size,
      combinedGzipDelta: consumers.combined.size.gzip - baseline.consumers.combined.size.gzip,
    },
    isolated,
    packageImports: imports,
    forbiddenGraphTokens: forbidden,
    classification: {
      core: [
        'small fixed-height range engine',
        'one renderer viewport bridge',
        'range-aware extension of the existing remote coordinator',
      ],
      optionalSplittable: [],
      dynamicCandidate: ['advanced filter builder remains the existing private chunk'],
      notWorthSplitting: ['synchronous range math and listener wiring'],
    },
  };
  const graph = { checkpoint: 'N2-011G', sourceComponent, isolated };
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
      throw new Error('N2-011G bundle artifacts are missing; run with --update.');
    }
    const stored = JSON.parse(readFileSync(artifactPath, 'utf8'));
    for (const [name, consumer] of Object.entries(consumers)) {
      const expected = stored.consumers[name]?.size;
      if (
        expected === undefined ||
        Math.abs(consumer.size.raw - expected.raw) > 256 ||
        Math.abs(consumer.size.gzip - expected.gzip) > 64 ||
        Math.abs(consumer.size.brotli - expected.brotli) > 64
      ) {
        throw new Error(`N2-011G bundle scenario drifted: ${name}`);
      }
    }
    console.log(
      `N2-011G bundle passed (basic ${consumers.basic.size.gzip} B gzip; client virtual ${consumers.clientVirtual.size.gzip} B; remote virtual ${consumers.remoteVirtual.size.gzip} B; combined ${consumers.combined.size.gzip} B; engine isolated ${isolated.virtualizationEngine.size.gzip} B; root-unused 0 B).`,
    );
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
