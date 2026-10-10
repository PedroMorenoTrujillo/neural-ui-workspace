import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { table2Checkpoint } from './n2-table-contract-manifest.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(root, 'dist', 'neural-ui', 'core');
const snapshotPath = join(root, 'baselines', 'n2-table', 'current-baseline.json');
const update = process.argv.includes('--update');

function filesUnder(path, predicate = () => true) {
  const result = [];
  for (const name of readdirSync(path)) {
    const child = join(path, name);
    const stat = statSync(child);
    if (stat.isDirectory()) result.push(...filesUnder(child, predicate));
    else if (predicate(child)) result.push(child);
  }
  return result.sort();
}

function compressed(bytes) {
  return {
    raw: bytes.byteLength,
    gzip: gzipSync(bytes, { level: 9 }).byteLength,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).byteLength,
  };
}

function packagePlugin() {
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

async function bundleConsumer(source) {
  const result = await build({
    bundle: true,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'],
    format: 'esm',
    minify: true,
    platform: 'browser',
    plugins: [packagePlugin()],
    stdin: { contents: source, loader: 'ts', resolveDir: root },
    treeShaking: true,
    write: false,
  });
  return compressed(Buffer.concat(result.outputFiles.map((file) => file.contents)));
}

function testTitles() {
  const tableRoot = join(root, 'projects', 'ui-core', 'table');
  return filesUnder(
    tableRoot,
    (path) => path.endsWith('.spec.ts') && !path.endsWith('.n2-baseline.spec.ts'),
  ).flatMap((path) => {
    const source = readFileSync(path, 'utf8');
    return [...source.matchAll(/\bit\(\s*['"`]([^'"`]+)['"`]/g)].map((match) => ({
      file: relative(root, path),
      title: match[1],
    }));
  });
}

function functionalBaseline(titles) {
  const patterns = {
    simpleRender: /render|display|row markup/i,
    sort: /sort/i,
    filter: /filter/i,
    pagination: /pagin|\bpage\b/i,
    selection: /select/i,
    virtual: /virtual/i,
    remoteLazy: /server|lazy|remote/i,
    editing: /edit/i,
    expansion: /expand|collapse/i,
    grouping: /group/i,
    export: /export|csv|json|xlsx/i,
  };
  return Object.fromEntries(
    Object.entries(patterns).map(([name, pattern]) => {
      const evidence = titles.filter(({ title }) => pattern.test(title));
      return [name, { testCount: evidence.length, evidence: evidence.slice(0, 5) }];
    }),
  );
}

function sourceImports(path) {
  const text = readFileSync(path, 'utf8');
  return [...text.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

function dependencyBaseline() {
  const tableRoot = join(root, 'projects', 'ui-core', 'table');
  const files = filesUnder(
    tableRoot,
    (path) =>
      path.endsWith('.ts') &&
      !path.endsWith('.spec.ts') &&
      !path.includes(`${join('table', 'next')}${process.platform === 'win32' ? '\\' : '/'}`),
  );
  const edges = files.flatMap((path) =>
    sourceImports(path).map((specifier) => ({ from: relative(root, path), to: specifier })),
  );
  const categories = {
    forms: edges.filter((edge) => edge.to.startsWith('@angular/forms')),
    router: edges.filter(
      (edge) => edge.to.startsWith('@angular/router') || edge.to.includes('url-state'),
    ),
    cdk: edges.filter((edge) => edge.to.startsWith('@angular/cdk')),
    export: edges.filter((edge) => /export/i.test(edge.from) || /export/i.test(edge.to)),
    storage: edges.filter(
      (edge) => /storage|url-state/i.test(edge.from) || /storage|url-state/i.test(edge.to),
    ),
    advanced: edges.filter(
      (edge) =>
        /advanced|optional-features|filter\.engine/i.test(edge.from) ||
        /advanced|optional-features|filter\.engine/i.test(edge.to),
    ),
  };
  return {
    sourceFiles: files.length,
    edges: edges.length,
    categories: Object.fromEntries(
      Object.entries(categories).map(([name, matches]) => [name, matches]),
    ),
  };
}

function primeBaseline() {
  const source = readFileSync(join(root, 'N2-PRIME22-MATRIX.md'), 'utf8');
  const rows = source
    .split(/\r?\n/)
    .filter((line) => /^\| F-\d+/.test(line))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
    .filter(([id]) => Number(id.slice(2)) <= 70)
    .map((cells) => ({
      id: cells[0],
      capability: cells[1],
      // F-031 contains a historical unescaped pipe in its Neural description.
      // Classification and decision remain stable when addressed from the row end.
      classification: cells.at(-4),
      decision: cells.at(-3),
    }));
  return {
    source: 'N2-PRIME22-MATRIX.md; no PrimeNG re-audit in N2-011A',
    parityTarget: rows.filter(
      (row) => row.classification === 'PARITY' || row.classification === 'REDESIGN',
    ),
    superiorityTarget: rows.filter((row) => row.classification === 'SUPERIOR'),
    outOfScope: rows.filter((row) => row.classification === 'OUT OF SCOPE'),
  };
}

function accessibilityBaseline(titles) {
  const tablePath = join(root, 'projects', 'ui-core', 'table', 'neu-table.component.ts');
  const source = readFileSync(tablePath, 'utf8');
  const patterns = {
    nativeTable: /<table\b/g,
    roles: /role=/g,
    headers: /<th\b|headers=/g,
    sorting: /aria-sort/g,
    selection: /aria-selected|aria-checked/g,
    keyboard: /keydown|KeyboardEvent/g,
    editing: /aria-invalid|edit/i,
    expansion: /aria-expanded/g,
    virtualRows: /aria-rowindex|aria-rowcount/g,
  };
  const sourceSignals = Object.fromEntries(
    Object.entries(patterns).map(([name, pattern]) => [name, (source.match(pattern) ?? []).length]),
  );
  const evidence = titles.filter(({ title }) =>
    /aria|keyboard|focus|role|screen reader/i.test(title),
  );
  return { sourceSignals, directedTests: evidence.length, evidence: evidence.slice(0, 12) };
}

function ssrBaseline(titles) {
  const entries = {
    table: join(root, 'projects', 'ui-core', 'table', 'neu-table.component.ts'),
    tableCore: join(root, 'projects', 'ui-core', 'table-core', 'neu-table-core.component.ts'),
  };
  const browserApis = ['window', 'document', 'ResizeObserver', 'localStorage', 'sessionStorage'];
  return {
    smokeCommand: 'npm run test:ssr-smoke',
    entries: Object.fromEntries(
      Object.entries(entries).map(([name, path]) => {
        const source = readFileSync(path, 'utf8');
        return [
          name,
          {
            imports: sourceImports(path),
            browserApiReferences: Object.fromEntries(
              browserApis.map((api) => [
                api,
                (source.match(new RegExp(`\\b${api}\\b`, 'g')) ?? []).length,
              ]),
            ),
          },
        ];
      }),
    ),
    hydrationEvidence: titles.filter(({ title }) =>
      /hydration|hydrate|server render|SSR/i.test(title),
    ),
    currentLimit:
      'No Table-specific DOM-reuse/NG050x/request-deduplication hydration fixture existed at the checkpoint; this absence is part of the baseline, not a PASS claim.',
  };
}

if (!existsSync(join(packageRoot, 'package.json'))) {
  throw new Error('Build ui-core before generating the N2 Table baseline.');
}

const consumers = {
  tableBasic: await bundleConsumer(
    "import {NeuTableComponent} from '@neural-ui/core/table';export{NeuTableComponent};",
  ),
  tableFeatureRich: await bundleConsumer(`import {
    NeuTableComponent,
    NeuTableExpandDirective,
    NeuTableFilterRegistry,
    NeuTableFilterTemplateDirective,
    NeuTableRowReorderHandleDirective,
    NeuTableToolbarDirective
  } from '@neural-ui/core/table';
  export {NeuTableComponent,NeuTableExpandDirective,NeuTableFilterRegistry,NeuTableFilterTemplateDirective,NeuTableRowReorderHandleDirective,NeuTableToolbarDirective};`),
  tableCoreBasic: await bundleConsumer(
    "import {NeuTableCoreComponent} from '@neural-ui/core/table-core';export{NeuTableCoreComponent};",
  ),
  rootUnused: await bundleConsumer("import {provideNeuralUI} from '@neural-ui/core';"),
};

const titles = testTitles();
const report = {
  checkpoint: table2Checkpoint,
  angular: '22.1.x',
  method: {
    functional: 'static inventory backed by the directed current-table test run',
    bundle: 'minified ESM consumer; Angular/CDK/ng-icons/RxJS external; gzip 9; Brotli 11',
    prime: 'extracted only from N2-PRIME22-MATRIX.md rows F-001..F-070',
  },
  functional: functionalBaseline(titles),
  performance: {
    snapshot: 'baselines/n2-table/performance.json',
    command: 'npm run capture:n2-table-performance -- --update',
    scenarios: [
      '1k client render (100-row page)',
      '10k client render (100-row page)',
      '10k sort',
      '10k filter',
      '10k selection',
      '10k virtual',
      '50 lifecycle cycles',
    ],
  },
  bundle: { consumers },
  accessibility: accessibilityBaseline(titles),
  ssrHydration: ssrBaseline(titles),
  prime: primeBaseline(),
  dependencies: dependencyBaseline(),
};

for (const [name, scenario] of Object.entries(report.functional)) {
  if (scenario.testCount === 0) throw new Error(`No functional baseline evidence for ${name}.`);
}
if (
  report.prime.parityTarget.length +
    report.prime.superiorityTarget.length +
    report.prime.outOfScope.length !==
  70
) {
  throw new Error('Prime Table P1 checklist does not contain exactly F-001..F-070.');
}
if (report.bundle.consumers.rootUnused.raw !== 0) {
  throw new Error(`Root-unused consumer retained ${report.bundle.consumers.rootUnused.raw} bytes.`);
}

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (update) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, serialized);
  console.log(`Updated ${snapshotPath}`);
} else {
  const stored = readFileSync(snapshotPath, 'utf8');
  if (stored !== serialized) {
    console.error(
      'N2 Table deterministic baseline is stale. Run with --update and review the diff.',
    );
    process.exit(1);
  }
  console.log(
    `N2 Table baselines passed (${titles.length} tests inventoried; ${Object.keys(consumers).length} bundle consumers; 70 Prime checklist rows).`,
  );
}
