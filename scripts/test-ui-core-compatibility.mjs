import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureRoot = join(workspaceRoot, 'fixtures', 'compatibility-consumer');
const distRoot = join(workspaceRoot, 'dist', 'neural-ui', 'core');
const workspacePackageJson = JSON.parse(readFileSync(join(workspaceRoot, 'package.json'), 'utf8'));
const frameworkVersion = workspacePackageJson.dependencies['@angular/core'];
const toolingVersion = workspacePackageJson.devDependencies['@angular/build'];

if (!existsSync(join(distRoot, 'package.json'))) {
  console.error('Compatibility test requires the compiled dist package. Run npm run build first.');
  process.exit(1);
}

const fixture = mkdtempSync(join(tmpdir(), 'neural-ui-angular-22-'));
const npmCache = mkdtempSync(join(tmpdir(), 'neural-ui-npm-cache-'));
cpSync(fixtureRoot, fixture, { recursive: true });

// Install the package exactly as consumers receive it. A `file:` dependency
// pointing at dist is symlinked by npm and would resolve Angular from this
// workspace instead of from the compatibility fixture.
const packResult = spawnSync('npm', ['pack', distRoot, '--pack-destination', fixture], {
  cwd: workspaceRoot,
  encoding: 'utf8',
  env: { ...process.env, npm_config_cache: npmCache },
});
if (packResult.error || packResult.status !== 0) {
  console.error(packResult.stderr || packResult.error?.message || 'Unable to pack the library.');
  process.exit(packResult.status ?? 1);
}
const packageTarball = packResult.stdout.trim().split('\n').at(-1);
if (!packageTarball) {
  console.error('npm pack did not return a package filename.');
  process.exit(1);
}

const packageJsonPath = join(fixture, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
packageJson.dependencies = {
  '@angular/cdk': workspacePackageJson.dependencies['@angular/cdk'],
  '@angular/common': frameworkVersion,
  '@angular/compiler': frameworkVersion,
  '@angular/core': frameworkVersion,
  '@angular/forms': frameworkVersion,
  '@angular/platform-browser': frameworkVersion,
  '@angular/platform-server': frameworkVersion,
  '@angular/router': frameworkVersion,
  '@angular/ssr': toolingVersion,
  '@neural-ui/core': `file:${join(fixture, packageTarball)}`,
  '@neural-icons/core': workspacePackageJson.dependencies['@neural-icons/core'],
  '@neural-icons/angular': workspacePackageJson.dependencies['@neural-icons/angular'],
  rxjs: workspacePackageJson.dependencies.rxjs,
  tslib: workspacePackageJson.dependencies.tslib,
};
packageJson.devDependencies = {
  '@types/node': '^24.0.0',
  '@angular-devkit/schematics': workspacePackageJson.devDependencies['@angular-devkit/schematics'],
  '@angular/build': toolingVersion,
  '@angular/cli': workspacePackageJson.devDependencies['@angular/cli'],
  '@angular/compiler-cli': workspacePackageJson.devDependencies['@angular/compiler-cli'],
  '@angular/ssr': toolingVersion,
  '@schematics/angular': workspacePackageJson.devDependencies['@schematics/angular'],
  '@types/node': '^22.0.0',
  typescript: workspacePackageJson.devDependencies.typescript,
};
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

try {
  const commands = [
    ['npm', ['install', '--no-audit', '--no-fund']],
    [
      'npx',
      [
        'ng',
        'add',
        '@neural-ui/core',
        '--skip-confirmation',
        '--project',
        'compatibility-consumer',
      ],
    ],
    ['npx', ['ng', 'generate', '@neural-ui/core:theme', '--name', 'compatibility-theme']],
    [
      'npx',
      [
        'ng',
        'generate',
        '@neural-ui/core:layout',
        'compatibility-layout',
        '--project',
        'compatibility-consumer',
      ],
    ],
    [
      'npx',
      [
        'ng',
        'generate',
        '@neural-ui/core:dashboard',
        'compatibility-dashboard',
        '--project',
        'compatibility-consumer',
      ],
    ],
    [
      'npx',
      [
        'ng',
        'generate',
        '@neural-ui/core:crud-page',
        'compatibility-crud',
        '--project',
        'compatibility-consumer',
      ],
    ],
    ['npm', ['run', 'build']],
    ['npx', ['ngc', '--project', 'tsconfig.app.json']],
    ['node', ['src/ssr-presets.mjs']],
    ['node', ['src/ssr-tree-table.mjs']],
    ['node', ['src/ssr-icons.mjs']],
    ['node', ['src/ssr-h9-events.mjs']],
    ['node', ['src/ssr-n2-forms.mjs']],
    ['node', ['src/ssr-rel-01e.mjs']],
    ['node', ['src/ssr-rel-01g.mjs']],
    [
      'node',
      [
        '--input-type=module',
        '--eval',
        "await import('@angular/compiler'); await import('@neural-ui/core/input'); await import('@neural-ui/core/modal'); await import('@neural-ui/core/table'); await import('@neural-ui/core/tree-table'); await import('@neural-ui/core/nav'); await import('@neural-ui/core/color-picker'); await import('@neural-ui/core/menu'); await import('@neural-ui/core/menu-shared'); await import('@neural-ui/core/menu-tiered'); await import('@neural-ui/core/pick-list'); await import('@neural-ui/core/kanban'); await import('@neural-ui/core/internal-state'); console.log('SSR entrypoint imports passed')",
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
  console.log(`Angular ${frameworkVersion} consumer fixture passed`);
} finally {
  if (process.env.NEURAL_UI_KEEP_COMPAT_FIXTURE === '1')
    console.log(`Retained compatibility fixture: ${fixture}`);
  else rmSync(fixture, { recursive: true, force: true });
  rmSync(npmCache, { recursive: true, force: true });
}
