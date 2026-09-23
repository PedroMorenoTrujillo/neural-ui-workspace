import assert from 'node:assert/strict';
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
import { chromium } from '@playwright/test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed:\n${result.stdout.slice(-4000)}\n${result.stderr.slice(-4000)}`,
    );
  }
  return result.stdout;
};

const fixture = run(process.execPath, [join(root, 'scripts/prepare-n2-forms-hydration.mjs')])
  .trim()
  .split(/\r?\n/)
  .at(-1);
assert.ok(fixture?.startsWith(root + '/.n2-forms-hydration-'));

try {
  const tsPath = join(fixture, 'tsconfig.json');
  const tsconfig = JSON.parse(readFileSync(tsPath, 'utf8'));
  tsconfig.compilerOptions.paths = {
    '@neural-ui/core': [join(root, 'dist/neural-ui/core')],
    '@neural-ui/core/*': [join(root, 'dist/neural-ui/core/*')],
  };
  writeFileSync(tsPath, `${JSON.stringify(tsconfig, null, 2)}\n`);

  run(join(root, 'node_modules/.bin/ng'), ['build'], fixture);
  run(process.execPath, [join(fixture, 'dist/server/server.mjs')], fixture);
  const browserRoot = join(fixture, 'dist/browser');
  const html = readFileSync(join(browserRoot, 'index.html'), 'utf8');
  assert.match(html, /ngh=/);
  assert.match(html, /id="n2-color-picker"/);
  assert.match(html, /neu-cp__trigger/);

  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    let file = join(browserRoot, requested === '/' ? 'index.html' : requested.slice(1));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    const contentTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.addInitScript(() => {
        window.EyeDropper = class {
          async open() {
            return { sRGBHex: '#abcdef' };
          }
        };
      });
      const diagnostics = [];
      page.on('pageerror', (error) => diagnostics.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error' || /NG05\d{2}/.test(message.text())) {
          diagnostics.push(message.text());
        }
      });
      let releaseScripts;
      const scriptsReady = new Promise((resolve) => {
        releaseScripts = resolve;
      });
      await page.route('**/*.js', async (route) => {
        await scriptsReady;
        await route.continue();
      });
      const port = server.address().port;
      await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'commit' });
      const trigger = page.locator('#n2-color-picker .neu-cp__trigger');
      await trigger.waitFor({ state: 'attached' });
      assert.equal(await page.locator('#n2-ready').textContent(), 'false');
      await page.evaluate(() => {
        window.__colorPickerTrigger = document.querySelector('#n2-color-picker .neu-cp__trigger');
      });
      releaseScripts();
      await page.waitForFunction(() => document.querySelector('#n2-ready')?.textContent === 'true');
      assert.equal(
        await page.evaluate(
          () =>
            window.__colorPickerTrigger ===
            document.querySelector('#n2-color-picker .neu-cp__trigger'),
        ),
        true,
      );
      assert.equal(
        (await page.locator('#n2-new-control-events').textContent()).includes('color-picker:'),
        false,
      );
      await trigger.click();
      await page.locator('.neu-cp__sample-button').waitFor({ state: 'visible' });
      const area = page.locator('.neu-cp__canvas-wrap');
      await area.focus();
      assert.equal(await area.getAttribute('role'), 'slider');
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() =>
        (document.querySelector('#n2-new-control-events')?.textContent ?? '').includes(
          'color-picker:',
        ),
      );
      let events = JSON.parse(await page.locator('#n2-new-control-events').textContent()).filter(
        (event) => event.startsWith('color-picker:'),
      );
      assert.equal(events.length, 1, 'first hydrated keyboard edit must emit once');
      const box = await area.boundingBox();
      assert.ok(box);
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.4);
      await page.mouse.down();
      await page.mouse.up();
      await page.waitForFunction(
        () =>
          JSON.parse(document.querySelector('#n2-new-control-events')?.textContent ?? '[]').filter(
            (event) => event.startsWith('color-picker:'),
          ).length >= 2,
      );
      events = JSON.parse(await page.locator('#n2-new-control-events').textContent()).filter(
        (event) => event.startsWith('color-picker:'),
      );
      assert.equal(events.length, 2, 'first pointer edit must emit once');
      await page.locator('.neu-cp__sample-button').click();
      await page.waitForFunction(
        () =>
          JSON.parse(document.querySelector('#n2-new-control-events')?.textContent ?? '[]').filter(
            (event) => event.startsWith('color-picker:'),
          ).length >= 3,
      );
      events = JSON.parse(await page.locator('#n2-new-control-events').textContent()).filter(
        (event) => event.startsWith('color-picker:'),
      );
      assert.equal(events.length, 3, 'first optional screen sample must emit once');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.neu-cp__panel').count(), 0);
      assert.deepEqual(diagnostics, []);
      console.log(
        'N2-024 ColorPicker Angular 22 Chromium SSR/hydration PASS: DOM reused, 0 NG050x, zoneless, first keyboard/pointer/sample edits once.',
      );
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
