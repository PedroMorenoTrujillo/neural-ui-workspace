import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(workspaceRoot, 'dist', 'neural-ui', 'core');
const packageJsonPath = join(packageRoot, 'package.json');

if (!existsSync(packageJsonPath)) {
  console.error('Package verification requires dist/neural-ui/core. Run npm run build first.');
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const requiredFiles = ['README.md', 'styles.scss', 'styles/index.scss'];
const missingFiles = requiredFiles.filter((file) => !existsSync(join(packageRoot, file)));
const missingExports = Object.entries(packageJson.exports ?? {})
  .filter(([entry]) => entry !== './styles' && entry !== './styles/*')
  .filter(([, target]) => {
    const path = typeof target === 'string' ? target : target.default ?? target.import;
    return !path || !existsSync(join(packageRoot, path));
  })
  .map(([entry]) => entry);
const rootTypes = packageJson.exports?.['.']?.types;
if (!rootTypes || !existsSync(join(packageRoot, rootTypes))) {
  missingExports.push('. (types)');
}

if (missingFiles.length || missingExports.length) {
  console.error('ui-core package verification failed:');
  for (const file of missingFiles) console.error(`- missing package file: ${file}`);
  for (const entry of missingExports) console.error(`- missing export target: ${entry}`);
  process.exit(1);
}

const npmCache = mkdtempSync(join(tmpdir(), 'neural-ui-npm-cache-'));
const pack = spawnSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: packageRoot,
  encoding: 'utf8',
  env: { ...process.env, npm_config_cache: npmCache },
});
rmSync(npmCache, { recursive: true, force: true });

if (pack.status !== 0) {
  process.stderr.write(pack.stderr);
  process.exit(pack.status ?? 1);
}

let packed;
try {
  packed = JSON.parse(pack.stdout);
} catch {
  console.error('npm pack did not return JSON output.');
  process.exit(1);
}

const packedFiles = new Set((packed[0]?.files ?? []).map((file) => file.path));
const missingPackedFiles = requiredFiles.filter((file) => !packedFiles.has(file));
if (missingPackedFiles.length) {
  console.error(`npm pack would omit required files: ${missingPackedFiles.join(', ')}`);
  process.exit(1);
}

console.log(`ui-core package verification passed (${packed[0]?.files?.length ?? 0} files)`);
