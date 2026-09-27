import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = resolve(root, 'dist/neural-ui/core');
const legacy = JSON.parse(readFileSync(resolve(root, 'baselines/n2-release/rel-01-package-bundle.json'), 'utf8'));
const environment = {
  node: process.versions.node,
  zlib: process.versions.zlib,
  brotli: process.versions.brotli ?? null,
  platform: process.platform,
  arch: process.arch,
};
if (JSON.stringify(environment) !== JSON.stringify({
  node: '22.22.3', zlib: '1.2.12', brotli: '1.2.0', platform: 'darwin', arch: 'arm64',
})) throw new Error(`Unexpected compression environment ${JSON.stringify(environment)}`);

for (let run = 1; run <= 2; run++) {
  const rows = [];
  for (const [name, expected] of Object.entries(legacy.measurements)) {
    const result = await verifyUnusedPackageExport(packageRoot, expected.specifier, expected.symbol);
    const used = result.used.size;
    rows.push({
      name,
      legacy: expected.used,
      current: used,
      delta: Object.fromEntries(Object.keys(used).map((metric) => [metric, used[metric] - expected.used[metric]])),
      unused: result.unused.size,
      invalidExportRejected: result.invalidExportRejected,
      packageInputs: result.used.packageInputs.filter((name) => name.startsWith('fesm2022/')),
    });
  }
  console.log(JSON.stringify({ run, environment, rows }));
}
