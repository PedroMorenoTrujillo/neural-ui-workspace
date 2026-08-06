import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const sourceRoot = join(root, 'projects/ui-core');
const distRoot = join(root, 'dist/neural-ui/core');
const snapshotPath = join(root, 'projects/ui-core/public-contract.snapshot.json');
const update = process.argv.includes('--update');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

const sourceFiles = walk(sourceRoot).filter((path) => /\.ts$/.test(path) && !/\.spec\.ts$/.test(path));
const components = {};
for (const path of sourceFiles.filter((candidate) => candidate.endsWith('.component.ts') || candidate.endsWith('.directive.ts'))) {
  const source = readFileSync(path, 'utf8');
  const selector = source.match(/selector:\s*['"]([^'"]+)['"]/)?.[1];
  if (!selector?.startsWith('neu-') && !selector?.startsWith('[neu')) continue;
  components[relative(sourceRoot, path)] = {
    selector,
    inputs: unique([...source.matchAll(/\b(?:readonly\s+)?([A-Za-z]\w*)\s*=\s*input(?:\.required)?(?:<[^;\n]+>)?\s*\(/g)].map((m) => m[1])),
    outputs: unique([...source.matchAll(/\b(?:readonly\s+)?([A-Za-z]\w*)\s*=\s*output(?:<[^;\n]+>)?\s*\(/g)].map((m) => m[1])),
  };
}

const packageJsonPath = join(distRoot, 'package.json');
if (!existsSync(packageJsonPath)) {
  console.error('Contract audit requires a compiled package. Run npm run build first.');
  process.exit(1);
}
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const tokensSource = readFileSync(join(sourceRoot, 'styles/_tokens.scss'), 'utf8');
const snapshot = {
  schemaVersion: 1,
  package: packageJson.name,
  exports: unique(Object.keys(packageJson.exports ?? {})),
  tokens: unique([...tokensSource.matchAll(/--(neu-[a-z0-9-]+)\s*:/g)].map((m) => `--${m[1]}`)),
  components: Object.fromEntries(Object.entries(components).sort(([a], [b]) => a.localeCompare(b))),
};
const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;

if (update) {
  writeFileSync(snapshotPath, serialized);
  console.log(`Public contract snapshot updated: ${relative(root, snapshotPath)}`);
  process.exit(0);
}
if (!existsSync(snapshotPath)) {
  console.error('Public contract snapshot is missing. Run npm run snapshot:contracts after reviewing the API.');
  process.exit(1);
}
const expected = readFileSync(snapshotPath, 'utf8');
if (expected !== serialized) {
  console.error('Public API contract changed. Review the diff and update the snapshot only for an approved additive change.');
  process.exit(1);
}
console.log(`Public contract audit passed (${snapshot.exports.length} exports, ${snapshot.tokens.length} tokens).`);
