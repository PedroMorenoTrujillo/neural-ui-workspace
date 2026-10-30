import { spawnSync } from 'node:child_process';
import {
  createReadStream,
  existsSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const node = process.execPath;
const dependencies = process.env.NEU_N2_DEPENDENCIES ?? join(root, 'node_modules');
const ng = join(dependencies, '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return result.stdout;
};

// Verification-only worktree: use package extracted from the immutable release tarball.
const prepared = run(
  node,
  [join(root, 'scripts/prepare-h9-browser-consumer.mjs'), '--hydrate'],
  root,
);
const fixture = prepared.trim().split(/\r?\n/)[0];
if (!fixture || !existsSync(fixture)) throw new Error('N2-022 hydration fixture not created.');

const tsPath = join(fixture, 'tsconfig.app.json');
const ts = JSON.parse(readFileSync(tsPath, 'utf8'));
ts.include = [
  'src/main.ts',
  'src/main.server.ts',
  'src/server.ts',
  'src/h9-hydration.component.ts',
];
writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);

try {
  run(ng, ['build'], fixture);
  const dist = join(fixture, 'dist');
  run(node, [join(dist, 'server/server.mjs')], fixture);
  const browserRoot = join(dist, 'browser');
  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    let file = join(browserRoot, requested === '/' ? 'index.html' : requested.slice(1));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(4390, '127.0.0.1', resolve);
  });
  try {
    process.env.NEU_H9_BROWSER = 'chromium';
    process.env.NEU_H9_HYDRATION_URL = 'http://127.0.0.1:4390';
    process.env.NEU_H9_HYDRATION_EVIDENCE = '/private/tmp/n2-022-hydration-results.json';
    await import(`./test-h9-hydration-browser.mjs?run=${Date.now()}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  console.log('N2-022 Chromium SSR/hydration passed.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
