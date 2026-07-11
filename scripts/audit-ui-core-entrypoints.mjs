import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const uiCore = join(root, 'projects/ui-core');

const serviceOnlyEntryPoints = new Set(['url-state']);
const nonDemoEntryPoints = new Set(['button', 'confirm-dialog', 'toggle-button-group']);

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
const packageJson = existsSync(distPackageJsonPath)
  ? JSON.parse(read(distPackageJsonPath))
  : null;
const exported = new Set();

if (packageJson) {
  for (const key of Object.keys(packageJson.exports ?? {})) {
    if (key === '.' || key === './package.json' || key.startsWith('./styles')) continue;
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

  const componentSpecs = files(dir, '.component.spec.ts');
  const directiveSpecs = files(dir, '.directive.spec.ts');
  const serviceSpecs = files(dir, '.service.spec.ts');
  const hasAnySpec = componentSpecs.length + directiveSpecs.length + serviceSpecs.length > 0;

  if (!hasAnySpec) {
    violations.push(`${rel}: missing spec file`);
  }

  if (!serviceOnlyEntryPoints.has(entry)) {
    const componentFiles = files(dir, '.component.ts');
    if (componentFiles.length === 0) {
      violations.push(`${rel}: missing standalone component file`);
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

const showcasePagesRoot = join(root, '..', 'neural-ui-showcase', 'projects/showcase/src/app/pages');
if (existsSync(showcasePagesRoot)) {
  for (const entry of entryPoints) {
    if (serviceOnlyEntryPoints.has(entry) || nonDemoEntryPoints.has(entry)) {
      continue;
    }

    const demoName = entry === 'modal' ? 'dialog-demo' : `${entry}-demo`;
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
