import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const { chromium, firefox, webkit } = createRequire(import.meta.url)(
  process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test',
);
const angularVersion = createRequire(import.meta.url)('@angular/core/package.json').version;
const results = [];
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type()))
      errors.push(`console.${message.type()}: ${message.text()}`);
  });
  page.on('requestfailed', (request) =>
    errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`),
  );
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`response ${response.status()}: ${response.url()}`);
  });
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  await page.route('**/*.js', async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto(process.env.NEU_H9_HYDRATION_URL ?? 'http://127.0.0.1:4390', {
      waitUntil: 'commit',
    });
    await page.locator('.neu-autocomplete__input').waitFor({ state: 'attached' });
    assert.equal(await page.locator('#hydration-ready').textContent(), 'false');
    assert.deepEqual(JSON.parse(await page.locator('#hydration-events').textContent()), []);
    assert.equal(
      await page.locator('#hydration-color .neu-cp__trigger').count(),
      1,
      'SSR HTML must contain the advanced ColorPicker trigger',
    );
    await page.evaluate(() => {
      window.__h9OriginalInput = document.querySelector('.neu-autocomplete__input');
      window.__h9OriginalColorTrigger = document.querySelector('#hydration-color .neu-cp__trigger');
    });
    release();
    await page.waitForFunction(
      () => document.querySelector('#hydration-ready')?.textContent === 'true',
    );
    await page.waitForFunction(() =>
      document.querySelector('#hydration-events')?.textContent?.includes('opened'),
    );
    assert.equal(
      await page.evaluate(
        () => window.__h9OriginalInput === document.querySelector('.neu-autocomplete__input'),
      ),
      true,
      'hydration must retain the server input node',
    );
    assert.equal(
      await page.evaluate(
        () =>
          window.__h9OriginalColorTrigger ===
          document.querySelector('#hydration-color .neu-cp__trigger'),
      ),
      true,
      'hydration must retain the server ColorPicker trigger',
    );
    const log = async () => {
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
      return JSON.parse(await page.locator('#hydration-events').textContent());
    };
    assert.deepEqual(await log(), ['opened']);
    await page.locator('#hydration-close').click();
    assert.deepEqual(await log(), ['opened', 'hidden']);
    await page.locator('#hydration-color .neu-cp__trigger').click();
    assert.deepEqual(await log(), ['opened', 'hidden', 'colorOpened']);
    await page.locator('.neu-cp__alpha-slider').fill('0.4');
    assert.deepEqual(await log(), [
      'opened',
      'hidden',
      'colorOpened',
      'colorChange',
      'colorEnd',
    ]);
    await page.keyboard.press('Escape');
    assert.deepEqual(await log(), [
      'opened',
      'hidden',
      'colorOpened',
      'colorChange',
      'colorEnd',
      'colorClosed',
    ]);
    await page.locator('.neu-autocomplete__input').evaluate((input) => {
      input.value = 'Alpha';
      input.setSelectionRange(0, 3);
    });
    assert.deepEqual(await log(), [
      'opened',
      'hidden',
      'colorOpened',
      'colorChange',
      'colorEnd',
      'colorClosed',
    ]);
    const input = page.locator('.neu-autocomplete__input');
    await input.fill('Al');
    await input.press('ArrowDown');
    await page.locator('.neu-autocomplete__option').first().waitFor();
    await input.press('Enter');
    assert.deepEqual(await log(), [
      'opened',
      'hidden',
      'colorOpened',
      'colorChange',
      'colorEnd',
      'colorClosed',
      'select',
    ]);
    assert.deepEqual(errors, []);
    results.push({
      browser: name,
      angularVersion,
      status: 'PASS',
      serverOutputs: 0,
      domReused: true,
      colorPickerDomReused: true,
      colorChanges: 1,
      colorEnds: 1,
      colorOpened: 1,
      colorClosed: 1,
      opened: 1,
      hidden: 1,
      domainSelect: 1,
      unexpectedConsole: 0,
      pageErrors: 0,
      failedResources: 0,
    });
    console.log(
      `${name}: PASS actual Angular ${angularVersion} hydration, ColorPicker DOM reuse/events, lifecycle and B01`,
    );
  } finally {
    release();
    await browser.close();
    writeFileSync(
      process.env.NEU_H9_HYDRATION_EVIDENCE ?? '/private/tmp/h9-a2-hydration-results.json',
      JSON.stringify(results, null, 2) + '\n',
    );
  }
}
