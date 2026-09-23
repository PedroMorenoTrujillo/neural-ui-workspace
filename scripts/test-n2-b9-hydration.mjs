import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout.slice(-4000)}\n${result.stderr.slice(-4000)}`);
  }
  return result.stdout;
}

const fixture = run(process.execPath, [join(root, 'scripts/prepare-n2-b9-hydration.mjs')])
  .trim().split(/\r?\n/).at(-1);
assert.ok(fixture?.startsWith(root + '/.n2-b9-hydration-'));
try {
  const tsPath = join(fixture, 'tsconfig.json');
  const config = JSON.parse(readFileSync(tsPath, 'utf8'));
  config.compilerOptions.paths = {
    '@neural-ui/core': [join(root, 'dist/neural-ui/core')],
    '@neural-ui/core/*': [join(root, 'dist/neural-ui/core/*')],
  };
  writeFileSync(tsPath, `${JSON.stringify(config, null, 2)}\n`);
  run(join(root, 'node_modules/.bin/ng'), ['build'], fixture);
  run(process.execPath, [join(fixture, 'dist/server/server.mjs')], fixture);
  const browserRoot = join(fixture, 'dist/browser');
  const html = readFileSync(join(browserRoot, 'index.html'), 'utf8');
  for (const marker of ['ngh=', 'id="b9-ltr"', 'id="b9-rtl"', 'id="b9-vertical"', 'id="b9-enhanced"']) {
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  }
  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    let file = join(browserRoot, requested === '/' ? 'index.html' : requested.slice(1));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': {
      '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    }[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    process.env.NEU_N2_HYDRATION_URL = `http://127.0.0.1:${server.address().port}`;
    await import('./test-n2-b9-hydration-browser.mjs');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
