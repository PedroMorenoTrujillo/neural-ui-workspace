import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const workspace = mkdtempSync(join(root, '.n2-d1-package-'));
const run = (command, args, cwd, timeout = 180000) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout, maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return `${result.stdout}\n${result.stderr}`;
};

try {
  for (const name of ['projects', 'angular.json', 'tsconfig.json', 'package.json', 'LICENSE']) {
    cpSync(join(root, name), join(workspace, name), { recursive: true, dereference: true });
  }
  mkdirSync(join(workspace, 'scripts'), { recursive: true });
  cpSync(join(root, 'scripts/verify-ui-core-package.mjs'), join(workspace, 'scripts/verify-ui-core-package.mjs'));
  run(join(root, 'node_modules/.bin/ng'), ['build', 'ui-core', '--configuration', 'production'], workspace);
  const packageRoot = join(workspace, 'dist/neural-ui/core');
  cpSync(join(root, 'LICENSE'), join(packageRoot, 'LICENSE'));
  const ignore = join(packageRoot, '.npmignore');
  if (existsSync(ignore)) rmSync(ignore);
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  for (const name of ['organization-chart', 'scheduler-gantt']) {
    if (existsSync(join(packageRoot, name)) || manifest.exports?.[`./${name}`]) {
      throw new Error(`Retired entrypoint remains in isolated package: ${name}`);
    }
  }
  const verified = run(process.execPath, [join(workspace, 'scripts/verify-ui-core-package.mjs')], workspace, 240000);
  const publint = run(join(root, 'node_modules/.bin/publint'), [packageRoot], root, 240000);
  const attw = run(join(root, 'node_modules/.bin/attw'), ['--pack', packageRoot, '--ignore-rules', 'cjs-resolves-to-esm', 'no-resolution'], root, 240000);
  console.log(verified.split('\n').find((line) => line.includes('verification passed')));
  console.log(`D1 isolated package PASS: ${Object.keys(manifest.exports ?? {}).length} exports; removed entrypoints absent; publint and ATTW PASS.`);
  if (/error|warning/i.test(publint + attw)) console.log('Tool notes: ' + (publint + attw).split('\n').filter((line) => /error|warning/i.test(line)).slice(0,5).join(' | '));
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
