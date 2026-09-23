import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout.slice(-4000)}\n${result.stderr.slice(-4000)}`);
  return result.stdout;
}

const fixture = run(process.execPath, [join(root, 'scripts/prepare-n2-forms-hydration.mjs')]).trim().split(/\r?\n/).at(-1);
assert.ok(fixture?.startsWith(root + '/.n2-forms-hydration-'));

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
  assert.match(html, /ngh=/);
  for (const id of ['n2-date-inline', 'n2-month-overlay', 'n2-month-inline', 'n2-year-overlay', 'n2-year-inline', 'n2-week-grid']) {
    assert.ok(html.includes(`id="${id}"`), `SSR missing ${id}`);
  }
  assert.match(html, /neu-date-input__week-number/);

  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    let file = join(browserRoot, requested === '/' ? 'index.html' : requested.slice(1));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ?? 'application/octet-stream' });
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
      const diagnostics = [];
      page.on('pageerror', (error) => diagnostics.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error' || /NG05\d{2}/.test(message.text())) diagnostics.push(message.text());
      });
      let releaseScripts;
      const scriptsReady = new Promise((resolve) => { releaseScripts = resolve; });
      await page.route('**/*.js', async (route) => { await scriptsReady; await route.continue(); });
      await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'commit' });
      await page.locator('#n2-week-grid .neu-date-input__week-number').first().waitFor({ state: 'attached' });
      assert.equal(await page.locator('#n2-ready').textContent(), 'false');
      await page.evaluate(() => {
        window.__n2DateInline = document.querySelector('#n2-date-inline .neu-date-input__panel');
        window.__n2MonthInline = document.querySelector('#n2-month-inline .neu-date-input__panel');
        window.__n2YearInline = document.querySelector('#n2-year-inline .neu-date-input__panel');
        window.__n2Week = document.querySelector('#n2-week-grid .neu-date-input__week-number');
      });
      releaseScripts();
      await page.waitForFunction(() => document.querySelector('#n2-ready')?.textContent === 'true');
      assert.deepEqual(await page.evaluate(() => [
        window.__n2DateInline === document.querySelector('#n2-date-inline .neu-date-input__panel'),
        window.__n2MonthInline === document.querySelector('#n2-month-inline .neu-date-input__panel'),
        window.__n2YearInline === document.querySelector('#n2-year-inline .neu-date-input__panel'),
        window.__n2Week === document.querySelector('#n2-week-grid .neu-date-input__week-number'),
      ]), [true, true, true, true]);
      assert.deepEqual(JSON.parse(await page.locator('#n2-period-events').textContent()), []);
      assert.deepEqual(JSON.parse(await page.locator('#n2-period-lifecycle').textContent()), []);
      assert.equal(await page.locator('#n2-week-grid .neu-date-input__week-number').first().textContent(), '53');
      await page.locator('#n2-month-inline [data-civil-month="10"]').click();
      await page.locator('#n2-year-inline [data-civil-year="2027"]').click();
      await page.waitForFunction(() => JSON.parse(document.querySelector('#n2-period-events')?.textContent ?? '[]').length === 2);
      assert.deepEqual(JSON.parse(await page.locator('#n2-period-events').textContent()), [
        'month-inline:{"year":2026,"month":10}', 'year-inline:{"year":2027}',
      ]);
      assert.deepEqual(JSON.parse(await page.locator('#n2-period-lifecycle').textContent()), []);
      await page.locator('#n2-month-overlay .neu-date-input__open').click();
      await page.locator('.neu-date-input__panel[role="dialog"] [data-civil-month="10"]').click();
      await page.locator('#n2-year-overlay .neu-date-input__open').click();
      await page.locator('.neu-date-input__panel[role="dialog"] [data-civil-year="2027"]').click();
      await page.waitForFunction(() => JSON.parse(document.querySelector('#n2-period-events')?.textContent ?? '[]').length === 4);
      await page.waitForFunction(() => JSON.parse(document.querySelector('#n2-period-lifecycle')?.textContent ?? '[]').length === 4);
      assert.deepEqual(JSON.parse(await page.locator('#n2-period-lifecycle').textContent()), [
        'month:opened', 'month:closed', 'year:opened', 'year:closed',
      ]);
      assert.deepEqual(JSON.parse(await page.locator('#n2-period-events').textContent()), [
        'month-inline:{"year":2026,"month":10}', 'year-inline:{"year":2027}',
        'month-overlay:{"year":2026,"month":10}', 'year-overlay:{"year":2027}',
      ]);
      assert.deepEqual(diagnostics, []);
      console.log('N2-025 DateInput Chromium SSR/hydration PASS: inline DOM reused, 0 NG050x, no initial echo, first month/year edits and overlay lifecycle exactly once.');
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
