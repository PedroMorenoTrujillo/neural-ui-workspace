import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(root, 'dist/neural-ui/core');
const historicalPath = join(root, 'baselines/n2-release/rel-01-package-bundle.json');
const baselinePath = join(root, 'baselines/n2-release/rel-01-package-bundle-active-n2.json');
const historicalSha256 = 'c2d296a2d72c42dd2162917a627305bdd3629072c73d837f292bc4f56bc42c23';
const historicalBytes = readFileSync(historicalPath);
if (createHash('sha256').update(historicalBytes).digest('hex') !== historicalSha256) {
  throw new Error('Historical REL-01 package evidence changed');
}
const historical = JSON.parse(historicalBytes.toString('utf8'));
const update = process.argv.includes('--update');
const compressionEnvironment = {
  node: process.versions.node,
  zlib: process.versions.zlib,
  brotli: process.versions.brotli ?? null,
  platform: process.platform,
  arch: process.arch,
  gzipLevel: 9,
  brotliQuality: 11,
};
const canonicalCodec = { node: '22.22.3', zlib: '1.2.12', brotli: '1.2.0', platform: 'darwin', arch: 'arm64', gzipLevel: 9, brotliQuality: 11 };
if (Object.entries(canonicalCodec).some(([key, value]) => compressionEnvironment[key] !== value)) {
  throw new Error(`REL-01 requires canonical compression runtime ${JSON.stringify(canonicalCodec)}; got ${JSON.stringify(compressionEnvironment)}.`);
}
const expected = update
  ? undefined
  : JSON.parse(readFileSync(baselinePath, 'utf8'));
if (expected && JSON.stringify(expected.compressionEnvironment) !== JSON.stringify(compressionEnvironment)) {
  throw new Error(`REL-01 compression environment differs: expected ${JSON.stringify(expected.compressionEnvironment)}, got ${JSON.stringify(compressionEnvironment)}.`);
}

const cases = [
  ['root', '@neural-ui/core', 'provideNeuralUI'],
  ['small-primitive', '@neural-ui/core/tag', 'NeuTagComponent'],
  ['table', '@neural-ui/core/table', 'NeuTableComponent'],
  ['tree-table', '@neural-ui/core/tree-table', 'NeuTreeTableComponent'],
  ['tree', '@neural-ui/core/tree', 'NeuTreeComponent'],
  ['virtual-list', '@neural-ui/core/virtual-list', 'NeuVirtualListComponent'],
];

const forbiddenByCase = {
  'small-primitive': ['table', 'tree', 'tree-table'],
  table: ['tree', 'tree-table'],
  tree: ['table', 'tree-table'],
  'virtual-list': ['table', 'tree', 'tree-table'],
};

function packageFesms(inputs) {
  return inputs.filter((input) => input.startsWith('fesm2022/'));
}

function assertIsolation(name, inputs) {
  const files = packageFesms(inputs);
  for (const forbidden of forbiddenByCase[name] ?? []) {
    if (files.some((file) => file === `fesm2022/neural-ui-core-${forbidden}.mjs`)) {
      throw new Error(`${name} retained ${forbidden}`);
    }
  }
}

if (!existsSync(join(packageRoot, 'package.json'))) throw new Error('Built package missing. Run npm run build.');

const measurements = {};
for (const [name, specifier, symbol] of cases) {
  const result = await verifyUnusedPackageExport(packageRoot, specifier, symbol);
  assertIsolation(name, result.used.packageInputs);
  measurements[name] = {
    specifier,
    symbol,
    unused: result.unused.size,
    used: result.used.size,
    unusedPackageInputs: packageFesms(result.unused.packageInputs),
    usedPackageInputs: packageFesms(result.used.packageInputs),
    invalidExportRejected: result.invalidExportRejected,
  };
  const old = historical.measurements[name];
  const gzipDeltas = { root: -2, 'small-primitive': 1, table: -89, 'tree-table': -15, tree: -33, 'virtual-list': 12 };
  if (!old || result.used.size.raw !== old.used.raw
    || result.used.size.brotli !== old.used.brotli
    || result.used.size.gzip - old.used.gzip !== gzipDeltas[name]) {
    throw new Error(`REL-01 codec migration differs from reviewed historical evidence: ${name}`);
  }
}

const harnesses = readdirSync(join(root, 'scripts'))
  .filter((name) => /^audit-.*bundle.*\.mjs$/.test(name))
  .filter((name) => /root.?unused/i.test(readFileSync(join(root, 'scripts', name), 'utf8')))
  .sort();

for (const name of harnesses) {
  const source = readFileSync(join(root, 'scripts', name), 'utf8');
  if (!source.includes('verifyUnusedPackageExport')) {
    throw new Error(`Root-unused harness lacks a validated package control: ${name}`);
  }
}

const evidence = {
  schemaVersion: 2,
  activeBaseline: 'N2 canonical REL-01 package bundle evidence',
  historicalProvenance: {
    path: 'baselines/n2-release/rel-01-package-bundle.json',
    sha256: historicalSha256,
    disposition: 'immutable REL-01 historical artifact',
  },
  method: 'built-package export map; JavaScript loader; empty tsconfig aliases; metafile inputs before tree-shaking; invalid and used controls',
  compressionEnvironment,
  measurements,
  auditedRootUnusedHarnesses: harnesses,
};

if (update) {
  writeFileSync(baselinePath, `${JSON.stringify(evidence, null, 2)}\n`);
} else {
  if (JSON.stringify(evidence) !== JSON.stringify(expected)) {
    throw new Error('Built package or harness inventory differs from REL-01 evidence baseline.');
  }
}

console.log(`REL-01 package bundle evidence PASS: ${cases.length} consumers, ${harnesses.length} root-unused harnesses, Tree ${measurements.tree.used.raw} B raw / ${measurements.tree.used.gzip} B gzip.`);
