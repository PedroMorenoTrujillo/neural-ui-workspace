import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const node = process.execPath;
const dependencies = process.env.NEU_N2_DEPENDENCIES ?? join(root, 'node_modules');
const ng = join(dependencies, '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const prepare = spawnSync(node, [join(root, 'scripts/prepare-n2-tree-table-hydration.mjs')], {
  cwd: root,
  encoding: 'utf8',
});
if (prepare.status !== 0) throw new Error(`${prepare.stdout}\n${prepare.stderr}`);
const fixture = prepare.stdout.trim().split('\n').at(-1);
if (!fixture || !existsSync(fixture)) throw new Error('TreeTable hydration fixture not created.');
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
};

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
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(4394, '127.0.0.1');
  });
  try {
    process.env.NEU_N2_TREE_TABLE_HYDRATION_URL = 'http://127.0.0.1:4394';
    await import(`./test-n2-tree-table-hydration-browser.mjs?run=${Date.now()}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
