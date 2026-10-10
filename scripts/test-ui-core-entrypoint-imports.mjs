import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const packageRoot = join(root, 'dist/neural-ui/core');
const packageJsonPath = join(packageRoot, 'package.json');

if (!existsSync(packageJsonPath)) {
  console.error('dist package not found. Run npm --prefix neural-ui-workspace run build first.');
  process.exit(1);
}

await import('../node_modules/@angular/compiler/fesm2022/compiler.mjs');

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const failures = [];
let checked = 0;

for (const [entry, config] of Object.entries(packageJson.exports ?? {})) {
  const importPath = typeof config === 'string' ? config : config.default ?? config.import;
  if (!importPath || !importPath.endsWith('.mjs')) {
    continue;
  }

  const fullPath = join(packageRoot, importPath);
  try {
    const module = await import(fullPath);
    if (Object.keys(module).length === 0) {
      failures.push(`${entry}: imported module has no exports`);
    }
    checked += 1;
  } catch (error) {
    failures.push(`${entry}: ${error?.message ?? error}`);
  }
}

if (failures.length) {
  console.error('ui-core entrypoint import smoke failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`ui-core entrypoint import smoke passed (${checked} imports)`);
