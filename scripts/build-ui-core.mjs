import { spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = dirname(__dirname);
const distPackageJsonPath = join(workspaceRoot, 'dist', 'neural-ui', 'core', 'package.json');
const distPackageRoot = dirname(distPackageJsonPath);
const distStylesEntryPath = join(distPackageRoot, 'styles.scss');
const isWatchMode = process.argv.includes('--watch');
const ngBinary = join(
  workspaceRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'ng.cmd' : 'ng',
);

const stylesExport = {
  sass: './styles.scss',
  style: './styles.scss',
  default: './styles.scss',
};

const stylesWildcardExport = {
  sass: './styles/*',
  style: './styles/*',
  default: './styles/*',
};

const stylesEntryContent = "@forward './styles/index';\n";

function patchDistPackageJson() {
  if (!existsSync(distPackageJsonPath)) {
    return;
  }

  const packageJson = JSON.parse(readFileSync(distPackageJsonPath, 'utf8'));
  let changed = false;

  packageJson.exports ??= {};

  if (JSON.stringify(packageJson.exports['./styles']) !== JSON.stringify(stylesExport)) {
    packageJson.exports['./styles'] = stylesExport;
    changed = true;
  }

  if (JSON.stringify(packageJson.exports['./styles/*']) !== JSON.stringify(stylesWildcardExport)) {
    packageJson.exports['./styles/*'] = stylesWildcardExport;
    changed = true;
  }

  if (packageJson.sass !== './styles.scss') {
    packageJson.sass = './styles.scss';
    changed = true;
  }

  if (packageJson.style !== './styles.scss') {
    packageJson.style = './styles.scss';
    changed = true;
  }

  if (!packageJson.sideEffects?.includes('./styles.scss')) {
    packageJson.sideEffects = Array.isArray(packageJson.sideEffects)
      ? [...packageJson.sideEffects, './styles.scss']
      : ['./styles.scss'];
    changed = true;
  }

  if (changed) {
    writeFileSync(distPackageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  }

  if (!existsSync(distStylesEntryPath) || readFileSync(distStylesEntryPath, 'utf8') !== stylesEntryContent) {
    writeFileSync(distStylesEntryPath, stylesEntryContent);
  }

  const legacyPartialEntryPath = join(distPackageRoot, '_styles.scss');
  if (existsSync(legacyPartialEntryPath)) {
    rmSync(legacyPartialEntryPath);
  }
}

const child = spawn(
  ngBinary,
  ['build', 'ui-core', '--configuration', 'production', ...(isWatchMode ? ['--watch'] : [])],
  {
    cwd: workspaceRoot,
    stdio: 'inherit',
  },
);

const patchInterval = setInterval(() => {
  patchDistPackageJson();
}, 500);

child.on('exit', (code) => {
  clearInterval(patchInterval);
  patchDistPackageJson();
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  clearInterval(patchInterval);
  console.error(error);
  process.exit(1);
});
