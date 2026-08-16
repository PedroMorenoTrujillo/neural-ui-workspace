import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const required = {
  'SECURITY.md': ['private security advisory', 'response or resolution SLA'],
  'CONTRIBUTING.md': ['npm run verify:release', 'visual baselines'],
  'SUPPORT.md': ['>=19.0.0 <23.0.0', 'JAWS'],
  'DEPRECATIONS.md': ['Semantic Versioning', 'major release'],
  'MIGRATIONS.md': ['idempotent Angular schematic', '1.12.x'],
  'RELEASE.md': ['human reviewer', 'exact public version'],
};

const failures = [];
for (const [name, phrases] of Object.entries(required)) {
  const path = join(root, name);
  if (!existsSync(path)) {
    failures.push(`${name}: missing`);
    continue;
  }
  const content = readFileSync(path, 'utf8');
  for (const phrase of phrases) {
    if (!content.includes(phrase))
      failures.push(`${name}: missing required policy text "${phrase}"`);
  }
}

const packageJson = JSON.parse(readFileSync(join(root, 'projects/ui-core/package.json'), 'utf8'));
for (const dependency of [
  '@angular/core',
  '@angular/common',
  '@angular/forms',
  '@angular/router',
  '@angular/cdk',
]) {
  if (packageJson.peerDependencies?.[dependency] !== '>=19.0.0 <23.0.0') {
    failures.push(`projects/ui-core/package.json: unexpected ${dependency} support range`);
  }
}

const readme = readFileSync(join(root, 'README.md'), 'utf8');
for (const name of Object.keys(required)) {
  if (!readme.includes(`./${name}`)) failures.push(`README.md: missing link to ${name}`);
}

if (failures.length) {
  console.error(
    ['Governance audit failed:', ...failures.map((failure) => `- ${failure}`)].join('\n'),
  );
  process.exit(1);
}

console.log(`Governance audit passed (${Object.keys(required).length} public policies).`);
