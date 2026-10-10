import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const { chromium, firefox, webkit } = createRequire(import.meta.url)(
  process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test',
);
const angularVersion = createRequire(import.meta.url)('@angular/core/package.json').version;
const results = [];
const requestedBrowser = process.env.NEU_H9_BROWSER;
const engines = { chromium, firefox, webkit };
const selectedEngines = requestedBrowser
  ? Object.entries(engines).filter(([name]) => name === requestedBrowser)
  : Object.entries(engines);
if (selectedEngines.length === 0) throw new Error(`Unknown browser: ${requestedBrowser}`);
for (const [name, engine] of selectedEngines) {
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
      window.__h9OriginalTextInput = document.querySelector('#hydration-input .neu-input__field');
      window.__h9OriginalTextarea = document.querySelector(
        '#hydration-textarea .neu-textarea__field',
      );
      window.__h9OriginalTree = document.querySelector('#hydration-tree .neu-tree');
      window.__h9OriginalKanbanCard = document.querySelector(
        '#hydration-kanban [data-neu-kanban-card-id="hydrated-card"]',
      );
      window.__h9OriginalDialog = document.querySelector('.neu-dialog__panel');
    });
    release();
    await page.waitForFunction(
      () => document.querySelector('#hydration-ready')?.textContent === 'true',
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
    for (const [saved, selector] of [
      ['__h9OriginalTextInput', '#hydration-input .neu-input__field'],
      ['__h9OriginalTextarea', '#hydration-textarea .neu-textarea__field'],
      ['__h9OriginalTree', '#hydration-tree .neu-tree'],
      ['__h9OriginalKanbanCard', '#hydration-kanban [data-neu-kanban-card-id="hydrated-card"]'],
      ['__h9OriginalDialog', '.neu-dialog__panel'],
    ]) {
      assert.equal(
        await page.evaluate(
          ({ saved, selector }) => window[saved] === document.querySelector(selector),
          { saved, selector },
        ),
        true,
        `hydration must retain ${selector}`,
      );
    }
    const log = async () => {
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
      return JSON.parse(await page.locator('#hydration-events').textContent());
    };
    assert.deepEqual(await log(), []);
    const imeDomTrace = await page.locator('#hydration-input').evaluate((host) => {
      const result = [];
      const input = host.querySelector('.neu-input__field');
      input.addEventListener('input', () => result.push(input.value));
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      input.value = 'に';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
      input.value = '日本';
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
      return result;
    });
    assert.deepEqual(imeDomTrace, ['に', '日本']);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    assert.deepEqual(JSON.parse(await page.locator('#hydration-ime-events').textContent()), [
      '日本',
    ]);
    assert.deepEqual(await log(), []);
    await page.locator('#hydration-close').click();
    assert.deepEqual(await log(), ['closed']);
    await page.locator('#hydration-open').click();
    assert.deepEqual(await log(), ['closed', 'opened']);
    await page.locator('#hydration-sheet-open').click();
    assert.deepEqual(await log(), ['closed', 'opened', 'sheetOpened']);
    await page.locator('.neu-bottom-sheet__close').click();
    assert.deepEqual(await log(), [
      'closed',
      'opened',
      'sheetOpened',
      'sheetRequest',
      'sheetClosed',
    ]);
    await page.locator('#hydration-close').click();
    assert.deepEqual(await log(), [
      'closed',
      'opened',
      'sheetOpened',
      'sheetRequest',
      'sheetClosed',
      'closed',
    ]);
    await page.locator('#hydration-color .neu-cp__trigger').click();
    assert.deepEqual(await log(), [
      'closed',
      'opened',
      'sheetOpened',
      'sheetRequest',
      'sheetClosed',
      'closed',
      'colorOpened',
    ]);
    await page.locator('.neu-cp__alpha-slider').fill('0.4');
    assert.deepEqual(await log(), [
      'closed',
      'opened',
      'sheetOpened',
      'sheetRequest',
      'sheetClosed',
      'closed',
      'colorOpened',
      'colorChange',
      'colorEnd',
    ]);
    await page.keyboard.press('Escape');
    assert.deepEqual(await log(), [
      'closed',
      'opened',
      'sheetOpened',
      'sheetRequest',
      'sheetClosed',
      'closed',
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
      'closed',
      'opened',
      'sheetOpened',
      'sheetRequest',
      'sheetClosed',
      'closed',
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
      'closed',
      'opened',
      'sheetOpened',
      'sheetRequest',
      'sheetClosed',
      'closed',
      'colorOpened',
      'colorChange',
      'colorEnd',
      'colorClosed',
      'select',
    ]);
    const kanbanCard = page.locator('#hydration-kanban [data-neu-kanban-card-id="hydrated-card"]');
    await kanbanCard.focus();
    for (const key of ['Space', 'ArrowRight', 'End', 'Enter']) await page.keyboard.press(key);
    assert.deepEqual(await log(), [
      'closed',
      'opened',
      'sheetOpened',
      'sheetRequest',
      'sheetClosed',
      'closed',
      'colorOpened',
      'colorChange',
      'colorEnd',
      'colorClosed',
      'select',
      'kanbanMove',
    ]);
    assert.equal(
      await page
        .locator('#hydration-kanban #two [data-neu-kanban-card-id="hydrated-card"]')
        .count(),
      1,
    );
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
      closed: 2,
      sheetOpened: 1,
      sheetClosed: 1,
      sheetRequests: 1,
      domainSelect: 1,
      inputImeCommits: 1,
      kanbanMoves: 1,
      affectedDomReused: true,
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
