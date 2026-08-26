import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const uiCore = join(root, 'projects/ui-core');

const nonVisualEntryPoints = new Set([
  'focus-trap',
  'foundation',
  'menu-foundation',
  'option-api',
  'tree-foundation',
  'url-state',
  'testing',
]);
const nonDemoEntryPoints = new Set(['button', 'confirm-dialog', 'toggle-button-group', 'testing']);
const demoEntryPointOverrides = new Map([['table-core', 'table-demo']]);

function dirs(path) {
  return readdirSync(path)
    .filter((entry) => {
      const full = join(path, entry);
      return statSync(full).isDirectory() && !entry.startsWith('.');
    })
    .sort((left, right) => left.localeCompare(right));
}

function files(path, suffix) {
  return readdirSync(path).filter((entry) => entry.endsWith(suffix));
}

function read(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const distPackageJsonPath = join(root, 'dist/neural-ui/core/package.json');
const packageJson = existsSync(distPackageJsonPath) ? JSON.parse(read(distPackageJsonPath)) : null;
const exported = new Set();

if (packageJson) {
  for (const key of Object.keys(packageJson.exports ?? {})) {
    if (key === '.' || key === './package.json' || key === './token-manifest.json' || key.startsWith('./styles')) continue;
    exported.add(key.replace(/^\.\//, ''));
  }
}

const violations = [];
const entryPoints = dirs(uiCore).filter((dir) => existsSync(join(uiCore, dir, 'ng-package.json')));

for (const entry of entryPoints) {
  const dir = join(uiCore, entry);
  const rel = relative(root, dir);

  if (!existsSync(join(dir, 'public_api.ts'))) {
    violations.push(`${rel}: missing public_api.ts`);
  }

  if (packageJson && !exported.has(entry)) {
    violations.push(`${rel}: missing package.json exports entry`);
  }

  const hasAnySpec = files(dir, '.spec.ts').length > 0;

  if (!hasAnySpec) {
    violations.push(`${rel}: missing spec file`);
  }

  if (!nonVisualEntryPoints.has(entry)) {
    const componentFiles = files(dir, '.component.ts');
    const directiveFiles = files(dir, '.directive.ts');
    if (componentFiles.length === 0 && directiveFiles.length === 0) {
      violations.push(`${rel}: missing standalone component or directive file`);
    }
  }
}

if (packageJson) {
  for (const entry of exported) {
    if (!entryPoints.includes(entry)) {
      violations.push(`package.json exports ./${entry}: missing ui-core entry point folder`);
    }
  }
}

const showcasePagesRoot = join(
  root,
  '..',
  process.env.NEURAL_UI_SHOWCASE_PATH ?? 'neural-ui-showcase',
  'projects/showcase/src/app/pages',
);
if (existsSync(showcasePagesRoot)) {
  for (const entry of entryPoints) {
    if (nonVisualEntryPoints.has(entry) || nonDemoEntryPoints.has(entry)) {
      continue;
    }

    const demoName =
      demoEntryPointOverrides.get(entry) ?? (entry === 'modal' ? 'dialog-demo' : `${entry}-demo`);
    if (!existsSync(join(showcasePagesRoot, demoName))) {
      violations.push(`ui-core/${entry}: missing showcase demo page ${demoName}`);
    }
  }
}

if (violations.length) {
  console.error('ui-core entrypoint audit failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`ui-core entrypoint audit passed (${entryPoints.length} entry points)`);
