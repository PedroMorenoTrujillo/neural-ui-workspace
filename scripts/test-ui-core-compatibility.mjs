import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureRoot = join(workspaceRoot, 'fixtures', 'compatibility-consumer');
const distRoot = join(workspaceRoot, 'dist', 'neural-ui', 'core');
const version = process.argv[process.argv.indexOf('--angular') + 1];

if (!/^(19|20|21|22)$/.test(version ?? '')) {
  console.error('Usage: npm run test:compat -- --angular <19|20|21|22>');
  process.exit(1);
}
if (!existsSync(join(distRoot, 'package.json'))) {
  console.error('Compatibility test requires the compiled dist package. Run npm run build first.');
  process.exit(1);
}

const fixture = mkdtempSync(join(tmpdir(), `neural-ui-angular-${version}-`));
const npmCache = mkdtempSync(join(tmpdir(), 'neural-ui-npm-cache-'));
cpSync(fixtureRoot, fixture, { recursive: true });

const typescriptByAngular = { 19: '~5.7.0', 20: '~5.8.0', 21: '~5.9.0', 22: '~6.0.0' };
const angularVersion = `^${version}.0.0`;
const packageJsonPath = join(fixture, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
packageJson.dependencies = {
  '@angular/cdk': angularVersion,
  '@angular/common': angularVersion,
  '@angular/compiler': angularVersion,
  '@angular/core': angularVersion,
  '@angular/forms': angularVersion,
  '@angular/platform-browser': angularVersion,
  '@angular/router': angularVersion,
  '@neural-ui/core': `file:${distRoot}`,
  // v31 is the last ng-icons line whose Angular peer range includes 19 and 20.
  '@ng-icons/core': '^31.4.0',
  '@ng-icons/lucide': '^31.4.0',
  apexcharts: '^5.10.4',
  'ng-apexcharts': version === '19' ? '^1.15.0' : '^2.3.0',
  rxjs: '~7.8.0',
  tslib: '^2.3.0',
};
packageJson.devDependencies = {
  '@angular/build': angularVersion,
  '@angular/cli': angularVersion,
  '@angular/compiler-cli': angularVersion,
  typescript: typescriptByAngular[version],
};
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

try {
  const commands = [
    ['npm', ['install', '--no-audit', '--no-fund']],
    ['npm', ['run', 'build']],
    [
      'node',
      [
        '--input-type=module',
        '--eval',
        "await import('@angular/compiler'); await import('@neural-ui/core/input'); await import('@neural-ui/core/modal'); await import('@neural-ui/core/table'); await import('@neural-ui/core/nav'); await import('@neural-ui/core/chart'); console.log('SSR entrypoint imports passed')",
      ],
    ],
  ];
  for (const [command, args] of commands) {
    const result = spawnSync(command, args, {
      cwd: fixture,
      stdio: 'inherit',
      env: { ...process.env, npm_config_cache: npmCache },
    });
    if (result.error) {
      console.error(`Unable to run ${command}: ${result.error.message}`);
      process.exit(1);
    }
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
  console.log(`Angular ${version} compatibility fixture passed`);
} finally {
  rmSync(fixture, { recursive: true, force: true });
  rmSync(npmCache, { recursive: true, force: true });
}
