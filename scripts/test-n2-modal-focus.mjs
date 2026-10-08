import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

// This consumer uses a captured local package and real browser keyboard events.
// No source aliases, WebKit focus-policy flags, or direct focus calls are used.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dependencies = resolve(process.env.NEU_N2_DEPENDENCIES ?? join(root, 'node_modules'));
const tarball = process.env.NEU_CORE_TARBALL;
assert.ok(tarball && existsSync(tarball), 'Set NEU_CORE_TARBALL to the captured local Core .tgz.');
const artifacts = resolve(process.env.NEU_MODAL_FOCUS_EVIDENCE ?? join(root, 'output/playwright/modal-focus'));
mkdirSync(artifacts, { recursive: true });
const fixture = mkdtempSync(join(tmpdir(), 'neural-modal-focus-consumer-'));
cpSync(join(root, 'fixtures/n2-modal-focus'), fixture, { recursive: true });
mkdirSync(join(fixture, 'node_modules/@neural-ui/core'), { recursive: true });
for (const name of readdirSync(dependencies)) {
  if (name === '@neural-ui' || name === '.package-lock.json') continue;
  symlinkSync(join(dependencies, name), join(fixture, 'node_modules', name), 'junction');
}
execFileSync('tar', ['-xzf', resolve(tarball), '--strip-components=1', '-C', join(fixture, 'node_modules/@neural-ui/core')]);
const packageMetadata = JSON.parse(readFileSync(join(fixture, 'node_modules/@neural-ui/core/package.json'), 'utf8'));
const report = {
  finding: 'CORE-P2-002',
  tarball: resolve(tarball),
  sha256: createHash('sha256').update(readFileSync(tarball)).digest('hex'),
  manifestVersion: packageMetadata.version,
  node: process.version,
  fixture,
  browsers: [],
};
const build = execFileSync(process.execPath, [join(dependencies, '@angular/cli/bin/ng.js'), 'build'], {
  cwd: fixture, encoding: 'utf8', timeout: 120000,
  env: { ...process.env, NG_BUILD_MAX_WORKERS: '2', NG_CLI_ANALYTICS: 'false', NO_COLOR: '1' },
});
writeFileSync(join(artifacts, 'consumer-build.log'), build);
const browserRoot = join(fixture, 'dist/browser');
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const file = join(browserRoot, pathname === '/' ? 'index.html' : pathname);
  if (!existsSync(file) || !statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.map': 'application/json' };
  response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
});
await new Promise((accept, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', accept); });
const url = `http://127.0.0.1:${server.address().port}`;
const require = createRequire(join(dependencies, 'package.json'));
const engines = require(process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test');

try {
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const result = { browser: name, scenarios: [], focusSteps: [], errors: [] };
    report.browsers.push(result);
    const browser = await engines[name].launch({ headless: true });
    const context = await browser.newContext();
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.on('pageerror', (error) => result.errors.push(error.message));
    await page.addInitScript(() => {
      const originalAdd = EventTarget.prototype.addEventListener;
      const originalRemove = EventTarget.prototype.removeEventListener;
      const listeners = new Set();
      window.__modalFocusListeners = listeners;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (this === document && type === 'keydown' && (options === true || options?.capture)) listeners.add(listener);
        return originalAdd.call(this, type, listener, options);
      };
      EventTarget.prototype.removeEventListener = function(type, listener, options) {
        if (this === document && type === 'keydown' && (options === true || options?.capture)) listeners.delete(listener);
        return originalRemove.call(this, type, listener, options);
      };
    });
    const scenario = async (title, work) => {
      try { await work(); result.scenarios.push({ title, status: 'PASS' }); }
      catch (error) { result.scenarios.push({ title, status: 'FAIL', error: error.message }); throw error; }
    };
    const visit = async () => { await page.goto(url); await page.locator('#ready').waitFor(); };
    const dialog = (title) => page.getByRole('dialog', { name: title, exact: true });
    const containsFocus = async (title, key) => {
      const step = await dialog(title).evaluate((panel, key) => ({
        key, active: document.activeElement?.id || document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName,
        inside: panel.contains(document.activeElement), documentFocus: document.hasFocus(),
      }), key);
      result.focusSteps.push({ title, ...step });
      assert.equal(step.inside, true, `${name}: ${key} escaped ${title}: ${step.active}`);
      assert.equal(step.documentFocus, true, `${name}: ${key} moved focus out of the document`);
      assert.ok(!['disabled', 'hidden', 'inert', 'underlying'].includes(step.active));
    };
    const cycle = async (title, key, steps = 16) => {
      for (let i = 0; i < steps; i++) { await page.keyboard.press(key); await containsFocus(title, key); }
    };
    const focused = async (id) => {
      await page.waitForFunction((id) => document.activeElement?.id === id, id);
      assert.equal(await page.evaluate(() => document.hasFocus()), true);
    };
    const escape = async (remaining, restored) => {
      await page.keyboard.press('Escape');
      await page.waitForFunction((count) => document.querySelectorAll('[role="dialog"]').length === count, remaining);
      await focused(restored);
    };
    try {
      await visit();
      await scenario('one dialog Tab and Shift+Tab keep actual document focus', async () => {
        await page.locator('#origin').click();
        await dialog('Parent').waitFor();
        await cycle('Parent', 'Tab');
        await cycle('Parent', 'Shift+Tab');
      });
      await scenario('two nested dialogs, disabled/hidden/inert controls, native WebKit policy', async () => {
        await page.locator('#open-child').click();
        await dialog('Child').waitFor();
        await cycle('Child', 'Tab', 24);
        await cycle('Child', 'Shift+Tab', 24);
      });
      await scenario('three nested dialogs Tab and Shift+Tab', async () => {
        await page.locator('#open-third').click();
        await dialog('Third').waitFor();
        await cycle('Third', 'Tab');
        await cycle('Third', 'Shift+Tab');
      });
      await scenario('Escape closes top only and restores all three trigger contexts', async () => {
        await escape(2, 'open-third');
        await escape(1, 'open-child');
        await escape(0, 'origin');
      });
      await scenario('dynamic addition and removal recover on the next real Tab', async () => {
        await page.locator('#origin').click();
        await page.locator('#open-child').click();
        await page.locator('#toggle-dynamic').click();
        await page.locator('#dynamic').waitFor();
        for (let i = 0; i < 12 && !(await page.locator('#dynamic').evaluate((el) => el === document.activeElement)); i++) {
          await page.keyboard.press('Tab');
          await containsFocus('Child', 'Tab');
        }
        await focused('dynamic');
        await page.keyboard.press('Delete');
        await page.locator('#dynamic').waitFor({ state: 'detached' });
        await page.keyboard.press('Tab');
        await containsFocus('Child', 'Tab after removal');
      });
      await scenario('destroying the focused upper dialog restores the lower context', async () => {
        await page.locator('#destroy-child').click();
        await dialog('Child').waitFor({ state: 'detached' });
        await focused('open-child');
        await cycle('Parent', 'Tab', 8);
        await escape(0, 'origin');
      });
      await scenario('opening two levels during another focus transition gives the upper ownership', async () => {
        // The previous scenario deliberately destroys the Child component.
        // The Child opened callback opens Third during initial focus. Start
        // with all owners mounted to isolate this ordered transition from the
        // earlier component-destruction scenario.
        await visit();
        await page.locator('#origin').click();
        await page.locator('#open-two').click();
        await dialog('Third').waitFor();
        await cycle('Third', 'Tab', 8);
        await cycle('Third', 'Shift+Tab', 8);
        await page.keyboard.press('Escape');
        await dialog('Third').waitFor({ state: 'detached' });
        await containsFocus('Child', 'Escape third');
        await page.keyboard.press('Escape');
        await dialog('Child').waitFor({ state: 'detached' });
        await containsFocus('Parent', 'Escape child');
        await escape(0, 'origin');
      });
      await scenario('ten rapid nested cycles leave no document traps', async () => {
        const before = await page.evaluate(() => window.__modalFocusListeners.size);
        for (let i = 0; i < 10; i++) {
          await page.locator('#origin').click();
          await page.locator('#open-child').click();
          await page.locator('#open-third').click();
          await cycle('Third', 'Tab', 3);
          await escape(2, 'open-third');
          await escape(1, 'open-child');
          await escape(0, 'origin');
          assert.equal(await page.evaluate(() => window.__modalFocusListeners.size), before);
        }
      });
      await scenario('destroying a lower dialog cannot steal focus from an upper dialog', async () => {
        await page.locator('#origin').click();
        await page.locator('#open-child').click();
        await page.locator('#destroy-parent').click();
        await dialog('Parent').waitFor({ state: 'detached' });
        await containsFocus('Child', 'destroy lower');
        await cycle('Child', 'Tab', 8);
        await cycle('Child', 'Shift+Tab', 8);
      });
      await scenario('no browser exceptions', async () => assert.deepEqual(result.errors, []));
    } catch (error) {
      result.failure = error.message;
      result.overlayDiagnostics = await page.evaluate(() => {
        const debug = window.ng;
        return Array.from(document.querySelectorAll('neu-dialog')).map((host) => {
          const component = debug?.getComponent?.(host);
          return {
            title: component?.title?.(), open: component?.open?.(), top: component?.isTopOverlay?.(),
            origin: component?.previousActiveElement?.id || component?.previousActiveElement?.getAttribute?.('aria-label'),
          };
        });
      });
      await page.screenshot({ path: join(artifacts, `${name}-failure.png`) });
    } finally {
      await context.tracing.stop({ path: join(artifacts, `${name}-trace.zip`) });
      await browser.close();
    }
  }
} finally {
  await new Promise((accept, reject) => server.close((error) => error ? reject(error) : accept()));
  writeFileSync(join(artifacts, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
}
assert.ok(report.browsers.every((result) => !result.failure), `Modal focus regression failed; see ${join(artifacts, 'results.json')}`);
console.log(`Core modal focus: ${report.browsers.reduce((count, result) => count + result.scenarios.length, 0)} passing scenarios; ${join(artifacts, 'results.json')}`);
