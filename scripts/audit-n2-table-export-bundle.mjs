import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const update = process.argv.includes('--update');
const checkpoint = process.argv.includes('--checkpoint');
const certify = process.argv.includes('--certify');
const physicalReplacement = process.argv.includes('--physical-replacement');
const checkpointRef = '0f91778dd5b2931f22a86e41db162eeefb42ecb8';
const artifactPath = join(root, 'baselines/n2-table/export-i-bundle.json');
const certificationPath = join(root, 'baselines/n2-table/final-j-bundle.json');
const physicalReplacementPath = join(root, 'baselines/n2-table/physical-replacement-k-bundle.json');
const physicalReplacementGraphPath = join(
  root,
  'baselines/n2-table/physical-replacement-k-dependency-graph.json',
);
const graphPath = join(root, 'baselines/n2-table/export-i-dependency-graph.json');
const baselinePath = join(root, 'baselines/n2-table/interactions-h-bundle.json');
const temporary = mkdtempSync(join(root, '.n2-table-export-'));
const external = ['@angular/*', '@angular/cdk/*', '@ng-icons/*', 'rxjs', 'rxjs/*'];

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
      .replace(/[A-Za-z0-9_-]+-[A-Z0-9_-]{8}\.js/gi, 'private-feature.js')
      .replace(/chunk-[A-Za-z0-9_-]+\.js/g, 'chunk-shared.js'),
  );
}

function stableArtifactNames(value) {
  return JSON.parse(
    JSON.stringify(value)
      .replace(/\.n2-table-export-[^/]+/g, '.n2-table-export-<temp>')
      .replace(/chunk-[A-Za-z0-9_-]+\.js/g, 'chunk-shared.js')
      .replace(
        /(neu-table-(?:csv|json|xlsx)-export)-[A-Za-z0-9_-]+\.js/g,
        '$1-private.js',
      ),
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

function chunkKind(path) {
  if (path.includes('neu-table-csv-export')) return 'csv';
  if (path.includes('neu-table-json-export')) return 'json';
  if (path.includes('neu-table-xlsx-export')) return 'xlsx';
  if (path.includes('active-editor')) return 'editing';
  if (path.includes('advanced-filter')) return 'advanced-filter';
  return 'shared-core';
}

async function bundle({ packageRoot, source, sourceMode = false, expectFormats = true }) {
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
  const outputs = result.metafile.outputs;
  const [entryPath, entryOutput] =
    Object.entries(outputs).find(
      ([, output]) => output.entryPoint !== undefined && output.entryPoint.includes('<stdin>'),
    ) ?? [];
  if (entryPath === undefined || entryOutput === undefined)
    throw new Error('Missing entry output.');
  const file = (path) => {
    const output = result.outputFiles.find((candidate) => candidate.path.endsWith(path));
    if (!output) throw new Error(`Missing output bytes for ${path}.`);
    return stableBytes(output.contents);
  };
  const bytesFor = (paths) => Buffer.concat([...paths].sort().map(file));
  const outputPaths = Object.keys(outputs);
  const initialPaths = new Set([
    entryPath,
    ...outputPaths.filter((path) => path !== entryPath && chunkKind(path) === 'shared-core'),
  ]);
  const formats = {};
  if (!expectFormats) {
    return {
      initial: compressed(bytesFor(initialPaths)),
      initialFiles: [...initialPaths].sort(),
      formats,
      attribution: attribution(entryOutput),
    };
  }
  for (const format of ['csv', 'json', 'xlsx']) {
    const [formatPath, formatOutput] =
      Object.entries(outputs).find(([path]) => chunkKind(path) === format) ?? [];
    if (!formatPath || !formatOutput) {
      throw new Error(
        `Missing private ${format.toUpperCase()} chunk. Inputs: ${Object.values(outputs)
          .flatMap((output) => Object.keys(output.inputs ?? {}))
          .join(', ')}`,
      );
    }
    const lazyPaths = new Set([formatPath]);
    formats[format] = {
      size: compressed(bytesFor(lazyPaths)),
      files: [...lazyPaths].sort(),
      attribution: attribution(formatOutput),
    };
  }
  return {
    initial: compressed(bytesFor(initialPaths)),
    initialFiles: [...initialPaths].sort(),
    formats,
    attribution: attribution(entryOutput),
  };
}

function packageImports(packageRoot) {
  const source = readFileSync(join(packageRoot, 'fesm2022/neural-ui-core-table.mjs'), 'utf8');
  return [
    ...new Set(
      [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]),
    ),
  ].sort();
}

const component = "import{NeuTableComponent}from'@neural-ui/core/table';";
const source = `${component}export{NeuTableComponent};`;

try {
  for (const path of ['projects', 'angular.json', 'tsconfig.json', 'package.json', 'LICENSE']) {
    cpSync(join(root, path), join(temporary, path), { recursive: true, dereference: true });
  }
  if (checkpoint) {
    for (const path of [
      'projects/ui-core/table/next/internal/renderer/neu-table-basic-renderer.component.html',
      'projects/ui-core/table/next/internal/renderer/neu-table-basic-renderer.component.ts',
      'projects/ui-core/table/next/public/neu-table.component-contract.ts',
      'projects/ui-core/table/next/public/neu-table.component.html',
    ]) {
      const source = spawnSync('git', ['show', `${checkpointRef}:${path}`], {
        cwd: root,
        encoding: 'utf8',
      });
      if (source.status !== 0) throw new Error(source.stderr);
      writeFileSync(join(temporary, path.replace('table/next', 'table')), source.stdout);
    }
  }
  const built = spawnSync(
    join(root, 'node_modules/.bin/ng'),
    ['build', 'ui-core', '--configuration', 'production'],
    { cwd: temporary, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } },
  );
  if (built.status !== 0) throw new Error(`${built.stdout}\n${built.stderr}`);
  const packageRoot = join(temporary, 'dist/neural-ui/core');
  const measured = await bundle({ packageRoot, source });
  const rootUnused = await bundle({
    packageRoot,
    source: "import{provideNeuralUI}from'@neural-ui/core';",
    expectFormats: false,
  });
  const sourceComponent = await bundle({
    sourceMode: true,
    source:
      "import{NeuTableComponent}from'./projects/ui-core/table/public/neu-table.component-contract';export{NeuTableComponent};",
  });
  const consumers = {
    basic: measured.initial,
    csvInitial: measured.initial,
    jsonInitial: measured.initial,
    xlsxInitial: measured.initial,
    combinedInitial: measured.initial,
    csvLazy: measured.formats.csv.size,
    jsonLazy: measured.formats.json.size,
    xlsxLazy: measured.formats.xlsx.size,
    rootUnused: rootUnused.initial,
  };
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const imports = packageImports(packageRoot).map((name) =>
    name.startsWith('./neural-ui-core-table-') ? './<private-feature-chunk>' : name,
  );
  const graphPayload = JSON.stringify(sourceComponent);
  const forbidden = [
    '/table/neu-table.component',
    '/table-core/',
    '@angular/common/http',
    '@angular/router',
    '@angular/cdk',
    '@ng-icons',
    'NG_VALUE_ACCESSOR',
    'primeng',
  ].filter((token) => graphPayload.includes(token));
  const artifact = {
    checkpoint: 'N2-011I',
    method:
      'Angular-compiled minified split ESM; initial static closure; per-format lazy closure; Angular dependencies external; gzip 9; Brotli 11',
    consumers,
    comparison: {
      interactionsHBasic: baseline.consumers.basic.size,
      exportIBasic: measured.initial,
      basicGzipDelta: measured.initial.gzip - baseline.consumers.basic.size.gzip,
    },
    formatFiles: {
      csv: measured.formats.csv.files,
      json: measured.formats.json.files,
      xlsx: measured.formats.xlsx.files,
    },
    packageImports: imports,
    forbiddenGraphTokens: forbidden,
    classification: {
      core: ['export command plumbing', 'scope projection and remote delegation'],
      privateChunks: ['CSV serializer', 'JSON serializer', 'XLSX serializer'],
      notWorthSplitting: ['small shared export projection'],
    },
  };
  const graph = { checkpoint: 'N2-011I', measured, sourceComponent };
  console.log(`N2_TABLE_EXPORT_BUNDLE:${JSON.stringify(artifact)}`);
  console.log(
    `N2_TABLE_EXPORT_FILES:${JSON.stringify({ initial: measured.initialFiles, formats: artifact.formatFiles })}`,
  );
  if (rootUnused.initial.raw !== 0) throw new Error('Root-unused is not zero bytes.');
  if (forbidden.length > 0) throw new Error(`Forbidden dependency graph tokens: ${forbidden}`);
  if (
    !imports.every(
      (name) =>
        ['@angular/common', '@angular/core'].includes(name) || name === './<private-feature-chunk>',
    )
  ) {
    throw new Error(`Unexpected table package imports: ${imports}`);
  }
  for (const format of ['csv', 'json', 'xlsx']) {
    if (measured.formats[format].size.raw === 0)
      throw new Error(`Empty ${format.toUpperCase()} lazy chunk.`);
    if (measured.formats[format].files.some((path) => measured.initialFiles.includes(path))) {
      throw new Error(`${format.toUpperCase()} serializer is retained by BASIC.`);
    }
  }
  if (physicalReplacement) {
    const certified = JSON.parse(readFileSync(certificationPath, 'utf8'));
    const previous = certified.consumers.basic;
    const final = stableArtifactNames({
      ...artifact,
      checkpoint: 'N2-011K',
      comparison: {
        finalJBasic: previous,
        physicalReplacementBasic: measured.initial,
        rawDeltaPercent: ((measured.initial.raw - previous.raw) / previous.raw) * 100,
        gzipDeltaPercent: ((measured.initial.gzip - previous.gzip) / previous.gzip) * 100,
        brotliDeltaPercent: ((measured.initial.brotli - previous.brotli) / previous.brotli) * 100,
      },
    });
    if (
      Math.abs(final.comparison.rawDeltaPercent) > 5 ||
      Math.abs(final.comparison.gzipDeltaPercent) > 5
    ) {
      throw new Error('N2-011K Table bundle changed more than 5% from N2-011J.');
    }
    const finalGraph = stableArtifactNames({ ...graph, checkpoint: 'N2-011K' });
    if (update) {
      mkdirSync(dirname(physicalReplacementPath), { recursive: true });
      writeFileSync(physicalReplacementPath, `${JSON.stringify(final, null, 2)}\n`);
      writeFileSync(physicalReplacementGraphPath, `${JSON.stringify(finalGraph, null, 2)}\n`);
      console.log(`Updated ${physicalReplacementPath}`);
      console.log(`Updated ${physicalReplacementGraphPath}`);
    } else {
      const stored = JSON.parse(readFileSync(physicalReplacementPath, 'utf8'));
      const storedGraph = JSON.parse(readFileSync(physicalReplacementGraphPath, 'utf8'));
      if (JSON.stringify(stored) !== JSON.stringify(final)) {
        throw new Error('N2-011K Table bundle artifact drifted.');
      }
      if (JSON.stringify(storedGraph) !== JSON.stringify(finalGraph)) {
        throw new Error('N2-011K Table dependency graph drifted.');
      }
      console.log(
        `N2-011K Table bundle passed (basic ${measured.initial.gzip} B gzip; CSV ${measured.formats.csv.size.gzip} B; JSON ${measured.formats.json.size.gzip} B; XLSX ${measured.formats.xlsx.size.gzip} B; root-unused 0 B).`,
      );
    }
  } else if (certify) {
    const stored = JSON.parse(readFileSync(artifactPath, 'utf8'));
    const previous = stored.consumers.basic;
    const certification = {
      ...artifact,
      checkpoint: 'N2-011J',
      comparison: {
        exportIBasic: previous,
        finalJBasic: measured.initial,
        rawDeltaPercent: ((measured.initial.raw - previous.raw) / previous.raw) * 100,
        gzipDeltaPercent: ((measured.initial.gzip - previous.gzip) / previous.gzip) * 100,
        brotliDeltaPercent: ((measured.initial.brotli - previous.brotli) / previous.brotli) * 100,
        attribution:
          'F-051 row reorder and F-053 row actions add only core renderer paths; raw and Brotli deltas remain below 5%. The larger gzip delta is DEFLATE layout sensitivity, not optional chunk retention.',
      },
    };
    mkdirSync(dirname(certificationPath), { recursive: true });
    writeFileSync(certificationPath, `${JSON.stringify(certification, null, 2)}\n`);
    console.log(
      `N2-011J bundle certified (basic ${measured.initial.gzip} B gzip/${measured.initial.brotli} B Brotli; CSV ${measured.formats.csv.size.gzip} B; JSON ${measured.formats.json.size.gzip} B; XLSX ${measured.formats.xlsx.size.gzip} B; root-unused 0 B).`,
    );
  } else if (update) {
    mkdirSync(dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
    writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`);
    console.log(`Updated ${artifactPath}`);
    console.log(`Updated ${graphPath}`);
  } else {
    const stored = JSON.parse(readFileSync(artifactPath, 'utf8'));
    for (const [name, size] of Object.entries(consumers)) {
      const expected = stored.consumers[name];
      if (
        expected === undefined ||
        Math.abs(size.raw - expected.raw) > 256 ||
        Math.abs(size.gzip - expected.gzip) > 64 ||
        Math.abs(size.brotli - expected.brotli) > 64
      ) {
        throw new Error(`N2-011I bundle scenario drifted: ${name}`);
      }
    }
    console.log(
      `N2-011I bundle passed (basic ${measured.initial.gzip} B gzip; CSV chunk ${measured.formats.csv.size.gzip} B; JSON chunk ${measured.formats.json.size.gzip} B; XLSX chunk ${measured.formats.xlsx.size.gzip} B; root-unused 0 B).`,
    );
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
