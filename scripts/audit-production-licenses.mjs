import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const allowed = new Set(['0BSD', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'MIT']);
const paths = execFileSync('npm', ['ls', '--omit=dev', '--all', '--parseable'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .slice(1)
  .filter(Boolean);

const packages = [];
const failures = [];
for (const path of paths) {
  const manifestPath = join(path, 'package.json');
  if (!existsSync(manifestPath)) {
    failures.push(`${path}: package.json is missing`);
    continue;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const license = manifest.license;
  packages.push(`${manifest.name}@${manifest.version} (${license ?? 'MISSING'})`);
  if (!allowed.has(license)) {
    failures.push(
      `${manifest.name}@${manifest.version}: license ${license ?? 'MISSING'} is not approved`,
    );
  }
}

if (failures.length) {
  console.error(
    ['Production license audit failed:', ...failures.map((item) => `- ${item}`)].join('\n'),
  );
  process.exit(1);
}

console.log(
  `Production license audit passed (${packages.length} packages; permissive OSI licenses only).`,
);
