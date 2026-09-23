import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import {
  findSourceMapReferences,
  isSourceMapCarrier,
  walkFiles,
} from './lib/release-artifacts.mjs';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = resolve(workspaceRoot, 'dist/neural-ui/core');
const policyPath = resolve(workspaceRoot, 'scripts/h9-b4-bundle-policy.json');
const profileArgument = process.argv.find((value) => value.startsWith('--profile='));
const profile = profileArgument?.slice('--profile='.length) ?? 'main';
const calibrating = process.argv.includes('--calibrate');
const baselineArgument = process.argv.find((value) => value.startsWith('--baseline='));
const baselineRoot = baselineArgument
  ? resolve(baselineArgument.slice('--baseline='.length))
  : undefined;

const compression = { gzip: { level: 9 }, brotli: { quality: 11 } };
const external = ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'];
const scenarios = {
  'root-unused': { source: "import { provideNeuralUI } from '@neural-ui/core';" },
  provider: { imports: [['provideNeuralUI', '']] },
  button: { imports: [['NeuButtonComponent', 'button']] },
  select: { imports: [['NeuSelectComponent', 'select']] },
  'table-basic': { imports: [['NeuTableComponent', 'table']] },
  'table-advanced-lazy': { imports: [['NeuTableComponent', 'table']] },
  'tree-basic': { imports: [['NeuTreeComponent', 'tree']] },
  'tree-checkbox': { imports: [['NeuTreeComponent', 'tree']] },
  'tree-lazy': { imports: [['NeuTreeComponent', 'tree']] },
  'tree-virtual': { imports: [['NeuTreeComponent', 'tree']] },
  'tree-dnd-full': { imports: [['NeuTreeComponent', 'tree']] },
  kanban: { imports: [['NeuKanbanComponent', 'kanban']] },
  'tree-table': { imports: [['NeuTreeTableComponent', 'tree-table']] },
  'dialog-basic': { imports: [['NeuDialogComponent', 'modal']] },
  'dialog-draggable': { imports: [['NeuDialogComponent', 'modal']] },
  'dialog-resizable': { imports: [['NeuDialogComponent', 'modal']] },
  'dialog-maximizable': { imports: [['NeuDialogComponent', 'modal']] },
  'dialog-all-advanced': { imports: [['NeuDialogComponent', 'modal']] },
  'color-picker-basic': { imports: [['NeuColorPickerComponent', 'color-picker']] },
  'color-picker-advanced': { imports: [['NeuColorPickerComponent', 'color-picker']] },
  'pick-list-order-list': {
    imports: [
      ['NeuPickListComponent', 'pick-list'],
      ['NeuOrderListComponent', 'pick-list'],
    ],
  },
  menu: { imports: [['NeuMenuComponent', 'menu']] },
  pagination: { imports: [['NeuPaginationComponent', 'pagination']] },
};
const prScenarios = new Set([
  'root-unused',
  'provider',
  'button',
  'table-basic',
  'table-advanced-lazy',
  'kanban',
  'color-picker-basic',
]);

function fail(message) {
  console.error(`H9-B4 bundle policy failed: ${message}`);
  process.exit(1);
}

function packagePlugin(root) {
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  return {
    name: 'neural-package',
    setup(api) {
      api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
        const suffix = path.slice('@neural-ui/core'.length);
        const exportKey = suffix ? `.${suffix}` : '.';
        const target = manifest.exports[exportKey]?.default;
        if (!target) throw new Error(`No export ${exportKey} in ${root}`);
        return { path: resolve(root, target), sideEffects: false };
      });
    },
  };
}

function scenarioSource(definition) {
  if (definition.source) return definition.source;
  return definition.imports
    .map(([symbol, entrypoint], index) => {
      const specifier = entrypoint ? `@neural-ui/core/${entrypoint}` : '@neural-ui/core';
      return `import { ${symbol} as retained${index} } from '${specifier}'; export { retained${index} };`;
    })
    .join('\n');
}

function compress(bytes) {
  return {
    raw: bytes.byteLength,
    gzip: gzipSync(bytes, { level: compression.gzip.level }).byteLength,
    brotli: brotliCompressSync(bytes, {
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: compression.brotli.quality },
    }).byteLength,
  };
}

async function measureScenario(root, definition) {
  const result = await build({
    bundle: true,
    external,
    format: 'esm',
    minify: true,
    platform: 'browser',
    plugins: [packagePlugin(root)],
    stdin: {
      contents: scenarioSource(definition),
      loader: 'js',
      resolveDir: workspaceRoot,
    },
    treeShaking: true,
    write: false,
  });
  return compress(Buffer.concat(result.outputFiles.map(({ contents }) => contents)));
}

async function measureScenarios(root, names) {
  const measured = {};
  for (const name of names) measured[name] = await measureScenario(root, scenarios[name]);
  return measured;
}

function measureAggregate(root) {
  const files = readdirSync(resolve(root, 'fesm2022'))
    .filter((file) => file.endsWith('.mjs'))
    .sort();
  const measurements = files.map((file) => compress(readFileSync(resolve(root, 'fesm2022', file))));
  return {
    chunks: files.length,
    raw: measurements.reduce((total, value) => total + value.raw, 0),
    gzip: measurements.reduce((total, value) => total + value.gzip, 0),
    brotli: measurements.reduce((total, value) => total + value.brotli, 0),
  };
}

function sanitizePackageForPublish(sourceRoot) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'neural-ui-h9b4-package-'));
  const sanitizedRoot = join(temporaryRoot, 'package');
  cpSync(sourceRoot, sanitizedRoot, { recursive: true });
  for (const path of walkFiles(sanitizedRoot)) {
    if (path.endsWith('.map')) {
      rmSync(path);
      continue;
    }
    if (!isSourceMapCarrier(path)) continue;
    const source = readFileSync(path, 'utf8');
    const normalized = source.replace(
      /(?:\/\/[#@]\s*sourceMappingURL=.*|\/\*#\s*sourceMappingURL=.*?\*\/)\s*$/gmu,
      '',
    );
    if (normalized !== source) writeFileSync(path, normalized);
  }
  return { temporaryRoot, sanitizedRoot };
}

function measurePackage(root) {
  const { temporaryRoot, sanitizedRoot } = sanitizePackageForPublish(root);
  const cache = mkdtempSync(join(tmpdir(), 'neural-ui-h9b4-npm-cache-'));
  try {
    const packed = spawnSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: sanitizedRoot,
      env: { ...process.env, npm_config_cache: cache },
      encoding: 'utf8',
    });
    if (packed.status !== 0) fail(`npm pack failed: ${packed.stderr}`);
    const result = JSON.parse(packed.stdout)[0];
    const publishedFiles = walkFiles(sanitizedRoot);
    const maps = publishedFiles.filter((path) => path.endsWith('.map'));
    const references = publishedFiles
      .filter(isSourceMapCarrier)
      .flatMap((path) => findSourceMapReferences(readFileSync(path, 'utf8')));
    return {
      packed: result.size,
      unpacked: result.unpackedSize,
      files: result.entryCount,
      publishedMaps: maps.length,
      sourceMappingUrls: references.length,
    };
  } finally {
    rmSync(cache, { recursive: true, force: true });
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function importSpecifiers(path) {
  const source = readFileSync(path, 'utf8');
  return [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

function architecturalChecks(root, measured, packageMetrics) {
  const errors = [];
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  if (JSON.stringify(manifest.dependencies ?? {}) !== JSON.stringify({ tslib: '^2.3.0' })) {
    errors.push(`runtime dependencies changed: ${JSON.stringify(manifest.dependencies ?? {})}`);
  }
  if (measured['root-unused']?.raw !== 0) {
    errors.push(`unused root import retained ${measured['root-unused'].raw} runtime bytes`);
  }
  if (packageMetrics.publishedMaps !== 0 || packageMetrics.sourceMappingUrls !== 0) {
    errors.push(
      `publish projection has ${packageMetrics.publishedMaps} maps and ${packageMetrics.sourceMappingUrls} sourceMappingURL references`,
    );
  }

  const files = readdirSync(resolve(root, 'fesm2022')).filter((file) => file.endsWith('.mjs'));
  const forbidden = /jspdf|pdfmake|xlsx\.full|exceljs|moment|lodash\/lodash|date-fns\/locale/i;
  for (const file of files) {
    const path = resolve(root, 'fesm2022', file);
    if (forbidden.test(readFileSync(path, 'utf8'))) {
      errors.push(`${file} contains a forbidden heavy dependency`);
    }
  }

  const dialogImports = importSpecifiers(resolve(root, 'fesm2022/neural-ui-core-modal.mjs'));
  if (dialogImports.some((specifier) => specifier.startsWith('@angular/cdk/drag-drop'))) {
    errors.push('Dialog retained an accidental @angular/cdk/drag-drop dependency');
  }
  const tableImports = importSpecifiers(resolve(root, 'fesm2022/neural-ui-core-table.mjs'));
  const tableUnexpected = tableImports.filter(
    (specifier) =>
      specifier !== '@angular/core' &&
      specifier !== '@angular/common' &&
      !specifier.startsWith('./'),
  );
  if (tableUnexpected.length) {
    errors.push(`Table final boundary leaked: ${[...new Set(tableUnexpected)].join(', ')}`);
  }
  if (!files.some((file) => file.startsWith('neural-ui-core-table-neural-ui-core-table-'))) {
    errors.push('Table advanced lazy chunk is missing');
  }

  const graph = new Map();
  for (const file of files) {
    const local = importSpecifiers(resolve(root, 'fesm2022', file))
      .filter((specifier) => specifier.startsWith('./'))
      .map((specifier) => basename(specifier));
    graph.set(file, local);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(file, stack) {
    if (visiting.has(file)) {
      errors.push(`entrypoint cycle: ${[...stack, file].join(' -> ')}`);
      return;
    }
    if (visited.has(file)) return;
    visiting.add(file);
    for (const dependency of graph.get(file) ?? []) {
      if (graph.has(dependency)) visit(dependency, [...stack, file]);
    }
    visiting.delete(file);
    visited.add(file);
  }
  for (const file of files) visit(file, []);
  return errors;
}

function statusFor(value, budget) {
  if (value > budget.failure) return 'FAIL';
  if (value > budget.warning) return 'WARN';
  return 'PASS';
}

function consumerBudget(baseline, metric, override) {
  if (override) return override;
  if (metric === 'raw' && baseline === 0) return { warning: 0, failure: 0 };
  const warningFloor = metric === 'raw' ? 128 : 64;
  const failureFloor = metric === 'raw' ? 256 : 128;
  const warningRate = metric === 'raw' ? 0.01 : 0.02;
  const failureRate = metric === 'raw' ? 0.025 : 0.05;
  return {
    warning: baseline + Math.max(warningFloor, Math.ceil(baseline * warningRate)),
    failure: baseline + Math.max(failureFloor, Math.ceil(baseline * failureRate)),
  };
}

if (!['pr', 'main', 'release'].includes(profile)) fail(`unknown profile ${profile}`);
if (!existsSync(resolve(packageRoot, 'package.json')))
  fail('dist package missing; run npm run build');

const selectedNames = profile === 'pr' ? [...prScenarios] : Object.keys(scenarios);
const current = await measureScenarios(packageRoot, selectedNames);
const aggregate = measureAggregate(packageRoot);
const packageMetrics = measurePackage(packageRoot);
const architecture = architecturalChecks(packageRoot, current, packageMetrics);

if (calibrating) {
  if (!baselineRoot || !existsSync(resolve(baselineRoot, 'package.json'))) {
    fail('--calibrate requires --baseline=/absolute/path/to/dist/neural-ui/core');
  }
  const baseline = await measureScenarios(baselineRoot, Object.keys(scenarios));
  const baselineAggregate = measureAggregate(baselineRoot);
  const baselinePackage = measurePackage(baselineRoot);
  console.log(
    JSON.stringify(
      {
        methodology: {
          consumer: 'minified ESM; Angular, CDK, ng-icons and RxJS external; esbuild tree shaking',
          raw: 'canonical strict bytes',
          gzip: compression.gzip,
          brotli: compression.brotli,
          atomicTemplates:
            'Angular standalone component templates retain one component implementation; input bindings do not create separate basic/advanced closures.',
        },
        baseline: { scenarios: baseline, aggregate: baselineAggregate, package: baselinePackage },
        candidate: { scenarios: current, aggregate, package: packageMetrics },
      },
      null,
      2,
    ),
  );
  if (architecture.length)
    console.error(`Architectural calibration failures:\n- ${architecture.join('\n- ')}`);
  process.exit(architecture.length ? 1 : 0);
}

if (!existsSync(policyPath)) fail('scripts/h9-b4-bundle-policy.json is missing');
const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
const rows = [];
for (const name of selectedNames) {
  const measurement = current[name];
  const scenarioPolicy = policy.scenarios[name];
  if (!scenarioPolicy) fail(`policy missing scenario ${name}`);
  const budgets = Object.fromEntries(
    ['raw', 'gzip', 'brotli'].map((metric) => [
      metric,
      consumerBudget(scenarioPolicy.baseline[metric], metric, scenarioPolicy.budget?.[metric]),
    ]),
  );
  const statuses = ['raw', 'gzip', 'brotli'].map((metric) =>
    statusFor(measurement[metric], budgets[metric]),
  );
  rows.push({
    scenario: name,
    raw: measurement.raw,
    gzip: measurement.gzip,
    brotli: measurement.brotli,
    baseline: `${scenarioPolicy.baseline.raw}/${scenarioPolicy.baseline.gzip}/${scenarioPolicy.baseline.brotli}`,
    delta: `${measurement.raw - scenarioPolicy.baseline.raw}/${measurement.gzip - scenarioPolicy.baseline.gzip}/${measurement.brotli - scenarioPolicy.baseline.brotli}`,
    warning: `${budgets.raw.warning}/${budgets.gzip.warning}/${budgets.brotli.warning}`,
    failure: `${budgets.raw.failure}/${budgets.gzip.failure}/${budgets.brotli.failure}`,
    status: statuses.includes('FAIL') ? 'FAIL' : statuses.includes('WARN') ? 'WARN' : 'PASS',
  });
}

const aggregateStatus = {
  raw: statusFor(aggregate.raw, policy.aggregate.raw),
  gzip: statusFor(aggregate.gzip, policy.aggregate.gzip),
  brotli: statusFor(aggregate.brotli, policy.aggregate.brotli),
};
const packageStatus = {
  packed: statusFor(packageMetrics.packed, policy.package.packed),
  unpacked: statusFor(packageMetrics.unpacked, policy.package.unpacked),
};

console.table(rows);
console.log(
  JSON.stringify(
    {
      profile,
      toolchain: policy.toolchain,
      aggregate: {
        ...aggregate,
        baseline: policy.aggregate.baseline,
        budget: {
          raw: policy.aggregate.raw,
          gzip: policy.aggregate.gzip,
          brotli: policy.aggregate.brotli,
        },
        status: aggregateStatus,
        enforcement:
          'Raw aggregate is diagnostic. Brotli 500 KiB is a warning; consumer and architectural gates remain authoritative.',
      },
      package: { ...packageMetrics, baseline: policy.package.baseline, status: packageStatus },
      architecture: { status: architecture.length ? 'FAIL' : 'PASS', errors: architecture },
    },
    null,
    2,
  ),
);

const scenarioFailures = rows.filter((row) => row.status === 'FAIL');
const hardFailures = [
  ...architecture,
  ...scenarioFailures.map((row) => `${row.scenario} exceeded its consumer failure budget`),
  ...(packageStatus.packed === 'FAIL' ? ['packed package exceeded its failure budget'] : []),
  ...(packageStatus.unpacked === 'FAIL' ? ['unpacked package exceeded its failure budget'] : []),
];
if (hardFailures.length) fail(`\n- ${hardFailures.join('\n- ')}`);
console.log(
  `H9-B4 bundle policy passed (${selectedNames.length} consumers, ${aggregate.chunks} chunks, ${architecture.length} architectural failures).`,
);
