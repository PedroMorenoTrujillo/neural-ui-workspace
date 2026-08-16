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
const inheritedNpmCache = process.env.NEURAL_UI_COMPAT_NPM_CACHE;
const npmCache = inheritedNpmCache || mkdtempSync(join(tmpdir(), 'neural-ui-npm-cache-'));
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
  '@neural-ui/core': `file:${join(fixture, packageTarball)}`,
  // v31 is the last ng-icons line whose Angular peer range includes 19 and 20.
  '@ng-icons/core': '^31.4.0',
  '@ng-icons/lucide': '^31.4.0',
  'chart.js': '^4.5.1',
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

if (version === '19') {
  const mainPath = join(fixture, 'src', 'main.ts');
  const mainSource = readFileSync(mainPath, 'utf8').replaceAll(
    'provideZonelessChangeDetection',
    'provideExperimentalZonelessChangeDetection',
  );
  writeFileSync(mainPath, mainSource);
}

const entrypointSmokePath = join(fixture, 'verify-entrypoints.mjs');
writeFileSync(
  entrypointSmokePath,
  [
    "import { readFileSync } from 'node:fs';",
    "import { createRequire } from 'node:module';",
    "await import('@angular/compiler');",
    'const require = createRequire(import.meta.url);',
    "const packagePath = require.resolve('@neural-ui/core/package.json');",
    "const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));",
    'let checked = 0;',
    'for (const [subpath, config] of Object.entries(packageJson.exports ?? {})) {',
    "  const target = typeof config === 'string' ? config : config.default ?? config.import;",
    "  if (!target?.endsWith('.mjs')) continue;",
    "  const specifier = subpath === '.' ? '@neural-ui/core' : `@neural-ui/core/${subpath.slice(2)}`;",
    '  const module = await import(specifier);',
    '  if (Object.keys(module).length === 0) throw new Error(`${specifier} has no public exports`);',
    '  checked += 1;',
    '}',
    'console.log(`Angular compatibility entrypoint imports passed (${checked})`);',
    '',
  ].join('\n'),
);

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
    ['node', [entrypointSmokePath]],
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
  if (!inheritedNpmCache) {
    rmSync(npmCache, { recursive: true, force: true });
  }
}
