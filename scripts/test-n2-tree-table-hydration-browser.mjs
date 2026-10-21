import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)(
  process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test',
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.NEU_PLAYWRIGHT_EXECUTABLE
    ? { executablePath: process.env.NEU_PLAYWRIGHT_EXECUTABLE }
    : {}),
});
const page = await browser.newPage();
const errors = [];
const scriptRequests = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('request', (request) => {
  if (request.url().endsWith('.js')) scriptRequests.push(request.url());
});
page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type()))
    errors.push(`${message.type()}: ${message.text()}`);
});
let release;
const gate = new Promise((resolve) => (release = resolve));
await page.route('**/*.js', async (route) => {
  await gate;
  await route.continue();
});

try {
  await page.goto(process.env.NEU_N2_TREE_TABLE_HYDRATION_URL ?? 'http://127.0.0.1:4394', {
    waitUntil: 'commit',
  });
  await page.locator('#n2-tree-primary table').waitFor({ state: 'attached' });
  assert.equal(await page.locator('#n2-tree-ready').textContent(), 'false');
  assert.equal(await page.locator('#n2-tree-events').textContent(), '[]');
  assert.equal(await page.locator('#n2-tree-diagnostic-events').textContent(), '[]');
  assert.equal(await page.locator('#n2-tree-remote-events').textContent(), '[]');
  assert.equal(await page.locator('#n2-tree-virtual-events').textContent(), '[]');
  assert.equal(await page.locator('#n2-tree-primary table').getAttribute('role'), 'treegrid');
  assert.equal(
    await page.locator('#n2-tree-primary table').getAttribute('aria-multiselectable'),
    'true',
  );
  assert.equal(await page.locator('#n2-tree-primary table').getAttribute('tabindex'), '-1');
  assert.equal(await page.locator('#n2-tree-primary tr[data-node-key]').count(), 3);
  // SSR and the first client render share a384px bootstrap; this fixture uses32px rows and overscan2.
  const expectedBootstrapCount = Math.min(200, Math.ceil(384 / 32) + 2);
  const serverBootstrapKeys = await page.locator('#n2-tree-virtual tr[data-node-key]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-node-key')));
  assert.equal(serverBootstrapKeys.length, expectedBootstrapCount);
  assert.equal(await page.locator('#n2-tree-virtual tr[data-node-key]').first().getAttribute('aria-rowindex'), '1');
  assert.equal(await page.locator('#n2-tree-virtual tr[data-node-key]').last().getAttribute('aria-rowindex'), String(expectedBootstrapCount));
  assert.equal(await page.locator('#n2-tree-virtual [data-virtual-spacer="after"] td').evaluate((cell) => cell.style.blockSize), ((200 - expectedBootstrapCount) * 32) + 'px');
  await page.evaluate(() => {
    window.__n2TreeBootstrapRows = [...document.querySelectorAll('#n2-tree-virtual tr[data-node-key]')];
  });
  assert.equal(await page.locator('#n2-tree-virtual table').getAttribute('aria-rowcount'), '200');
  assert.equal(await page.locator('#n2-tree-primary input[type="search"]').count(), 1);
  assert.equal(
    await page.locator('#n2-tree-primary th[data-column-id="name"]').getAttribute('aria-sort'),
    'none',
  );
  assert.deepEqual(
    await page
      .locator('#n2-tree-primary tr[data-node-key]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('tabindex'))),
    ['0', '-1', '-1'],
  );
  assert.equal(
    await page.locator('#n2-tree-primary tr[data-node-key="string:a"]').getAttribute('aria-level'),
    '1',
  );
  assert.equal(
    await page.locator('#n2-tree-primary tr[data-node-key="string:b"]').getAttribute('aria-level'),
    '2',
  );
  assert.equal(
    await page
      .locator('#n2-tree-primary tr[data-node-key="string:a"]')
      .getAttribute('aria-selected'),
    'true',
  );
  assert.equal(
    await page
      .locator('#n2-tree-primary tr[data-node-key="string:a"] [data-selection-indicator] input')
      .getAttribute('aria-checked'),
    'mixed',
  );
  assert.match(await page.locator('#n2-tree-empty').textContent(), /SSR empty tree/);
  assert.match(await page.locator('#n2-tree-loading').textContent(), /SSR loading tree/);
  assert.match(await page.locator('#n2-tree-error').textContent(), /SSR error tree/);
  assert.equal(
    await page
      .locator('#n2-tree-unloaded button.neu-tree-table2__expander')
      .getAttribute('aria-expanded'),
    'false',
  );
  await page.evaluate(() => {
    window.__n2TreeNodes = [
      document.querySelector('#n2-tree-primary table'),
      document.querySelector('#n2-tree-primary thead'),
      document.querySelector('#n2-tree-primary tr[data-node-key="string:a"]'),
      document.querySelector('#n2-tree-primary tr[data-node-key="string:b"]'),
      document.querySelector('#n2-tree-virtual table'),
      document.querySelector('#n2-tree-virtual tr[data-node-key="string:virtual-0"]'),
    ];
  });
  release();
  await page.waitForFunction(
    () => document.querySelector('#n2-tree-ready')?.textContent === 'true',
  );
  assert.deepEqual(await page.locator('#n2-tree-virtual tr[data-node-key]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-node-key'))), serverBootstrapKeys);
  assert.ok(await page.evaluate(() => window.__n2TreeBootstrapRows.every((node, index) => node === document.querySelectorAll('#n2-tree-virtual tr[data-node-key]')[index])));
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-tree-diagnostic-events')?.textContent ===
      '["invalid-tree-column"]',
  );
  assert.deepEqual(
    await page.evaluate(() => {
      const selectors = [
        '#n2-tree-primary table',
        '#n2-tree-primary thead',
        '#n2-tree-primary tr[data-node-key="string:a"]',
        '#n2-tree-primary tr[data-node-key="string:b"]',
        '#n2-tree-virtual table',
        '#n2-tree-virtual tr[data-node-key="string:virtual-0"]',
      ];
      return window.__n2TreeNodes.map(
        (node, index) => node === document.querySelector(selectors[index]),
      );
    }),
    [true, true, true, true, true, true],
  );
  assert.deepEqual(
    await page.locator('#n2-tree-primary table').evaluate((table) => ({
      table: table.tagName,
      head: table.querySelector('thead')?.tagName,
      body: table.querySelector('tbody')?.tagName,
      row: table.querySelector('tbody tr')?.tagName,
      header: table.querySelector('th')?.tagName,
      cell: table.querySelector('td')?.tagName,
    })),
    { table: 'TABLE', head: 'THEAD', body: 'TBODY', row: 'TR', header: 'TH', cell: 'TD' },
  );
  assert.equal(await page.locator('#n2-tree-empty').getByText('SSR empty tree').count(), 1);
  assert.equal(await page.locator('#n2-tree-loading').getByText('SSR loading tree').count(), 1);
  assert.equal(await page.locator('#n2-tree-error').getByText('SSR error tree').count(), 1);
  const structuralReview = await page.locator('#n2-tree-primary').evaluate((section) => {
    section.setAttribute('dir', 'rtl');
    section.style.inlineSize = '320px';
    section.style.maxInlineSize = '320px';
    const viewport = section.querySelector('.neu-tree-table2__viewport');
    const childTreeCell = section.querySelector(
      'tr[data-node-key="string:b"] .neu-tree-table2__tree-cell',
    );
    const viewportStyle = viewport ? getComputedStyle(viewport) : null;
    const treeCellStyle = childTreeCell ? getComputedStyle(childTreeCell) : null;
    const result = {
      direction: getComputedStyle(section).direction,
      contained: Boolean(viewport && viewport.getBoundingClientRect().width <= 320),
      overflow: viewportStyle?.overflowX,
      logicalIndent: Number.parseFloat(treeCellStyle?.paddingRight ?? '0') > 0,
    };
    section.removeAttribute('dir');
    section.style.removeProperty('inline-size');
    section.style.removeProperty('max-inline-size');
    return result;
  });
  assert.deepEqual(structuralReview, {
    direction: 'rtl',
    contained: true,
    overflow: 'auto',
    logicalIndent: true,
  });
  assert.equal(await page.locator('#n2-tree-events').textContent(), '[]');
  assert.equal(
    await page.locator('#n2-tree-diagnostic-events').textContent(),
    '["invalid-tree-column"]',
  );
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-tree-remote-events')?.textContent ===
      '["unsatisfied:roots:initial:1"]',
  );
  await page.waitForFunction(() => {
    const events = JSON.parse(
      document.querySelector('#n2-tree-virtual-events')?.textContent ?? '[]',
    );
    return events.some((event) => event.startsWith('resize:'));
  });
  assert.ok((await page.locator('#n2-tree-virtual tr[data-node-key]').count()) <= 20);
  const virtualViewport = page.locator('#n2-tree-virtual .neu-tree-table2__viewport');
  await virtualViewport.evaluate((viewport) => {
    viewport.scrollTop = 3_200;
    viewport.dispatchEvent(new Event('scroll'));
  });
  await page.waitForFunction(() => {
    const events = JSON.parse(
      document.querySelector('#n2-tree-virtual-events')?.textContent ?? '[]',
    );
    return events.some((event) => event.startsWith('scroll:'));
  });
  assert.ok((await page.locator('#n2-tree-virtual tr[data-node-key]').count()) <= 30);
  assert.equal(
    await page.locator('#n2-tree-virtual tr[data-node-key]').first().getAttribute('aria-rowindex'),
    '99',
  );
  assert.equal(
    JSON.parse(await page.locator('#n2-tree-virtual-events').textContent()).includes('dataRequest'),
    false,
  );
  assert.equal(
    await page.evaluate(() =>
      document.querySelector('#n2-tree-primary')?.contains(document.activeElement),
    ),
    false,
  );
  await page.locator('#n2-tree-parent-write').click();
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#n2-tree-primary tr[data-node-key]').count(), 3);
  assert.equal(await page.locator('#n2-tree-events').textContent(), '[]');

  await page.locator('#n2-tree-expand-remote').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-tree-remote-events')?.textContent ===
      '["unsatisfied:roots:initial:1","child:children:expand:1:a"]',
  );
  await page.waitForTimeout(20);
  assert.equal(
    await page.locator('#n2-tree-remote-events').textContent(),
    '["unsatisfied:roots:initial:1","child:children:expand:1:a"]',
  );

  const expander = page.locator(
    '#n2-tree-primary tr[data-node-key="string:a"] button.neu-tree-table2__expander',
  );
  await expander.click();
  await page.waitForTimeout(20);
  assert.equal(await page.locator('#n2-tree-primary tr[data-node-key]').count(), 3);
  assert.equal(
    await page.locator('#n2-tree-events').textContent(),
    '["expandedKeysChange:toggle:a"]',
  );

  await page.locator('#n2-tree-accept').click();
  await expander.click();
  await page.waitForTimeout(20);
  assert.equal(await page.locator('#n2-tree-primary tr[data-node-key]').count(), 2);
  assert.equal(
    await page.locator('#n2-tree-events').textContent(),
    '["expandedKeysChange:toggle:a","expandedKeysChange:toggle:a"]',
  );

  const rootRow = page.locator('#n2-tree-primary tr[data-node-key="string:a"]');
  await rootRow.focus();
  await rootRow.press('ArrowRight');
  await page.waitForTimeout(20);
  assert.equal(await page.locator('#n2-tree-primary tr[data-node-key]').count(), 3);
  assert.equal(
    await page.locator('#n2-tree-events').textContent(),
    '["expandedKeysChange:toggle:a","expandedKeysChange:toggle:a","expandedKeysChange:keyboard:a"]',
  );
  await rootRow.press('ArrowRight');
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute('data-node-key')),
    'string:b',
  );
  await page.keyboard.press('ArrowLeft');
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute('data-node-key')),
    'string:a',
  );

  await page.evaluate(() =>
    document
      .querySelector('#n2-tree-empty-write')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true })),
  );
  await page.waitForTimeout(20);
  assert.equal(await page.locator('#n2-tree-primary tr[data-node-key]').count(), 0);
  assert.equal(
    await page.evaluate(
      () => document.activeElement === document.querySelector('#n2-tree-primary table'),
    ),
    true,
  );
  assert.equal(await page.locator('#n2-tree-primary table').getAttribute('tabindex'), '0');
  await page.evaluate(() =>
    document
      .querySelector('#n2-tree-restore-write')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true })),
  );
  await page.waitForTimeout(20);
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute('data-node-key')),
    'string:a',
  );
  assert.equal(await page.locator('#n2-tree-primary table').getAttribute('tabindex'), '-1');

  const childSelection = page.locator(
    '#n2-tree-primary tr[data-node-key="string:b"] [data-selection-indicator] input',
  );
  await childSelection.locator('..').click();
  await page.waitForTimeout(20);
  assert.equal(
    await page.locator('#n2-tree-events').textContent(),
    '["expandedKeysChange:toggle:a","expandedKeysChange:toggle:a","expandedKeysChange:keyboard:a","selectionChange:checkbox:b"]',
  );
  assert.equal(
    await page
      .locator('#n2-tree-primary tr[data-node-key="string:b"]')
      .getAttribute('aria-selected'),
    'false',
  );
  assert.equal(await childSelection.isChecked(), false);
  await page.locator('#n2-tree-accept-selection').click();
  await childSelection.locator('..').click();
  await page.waitForTimeout(20);
  assert.equal(
    await page.locator('#n2-tree-events').textContent(),
    '["expandedKeysChange:toggle:a","expandedKeysChange:toggle:a","expandedKeysChange:keyboard:a","selectionChange:checkbox:b","selectionChange:checkbox:b"]',
  );
  assert.equal(
    await page
      .locator('#n2-tree-primary tr[data-node-key="string:b"]')
      .getAttribute('aria-selected'),
    'true',
  );
  assert.equal(await childSelection.isChecked(), true);
  assert.equal(
    await page
      .locator('#n2-tree-primary tr[data-node-key="string:a"] [data-selection-indicator] input')
      .getAttribute('aria-checked'),
    'true',
  );

  const eventsBeforeQuery = JSON.parse(await page.locator('#n2-tree-events').textContent());
  const search = page.locator('#n2-tree-primary input[type="search"]');
  await search.fill('Gamma');
  await page.waitForTimeout(20);
  assert.equal(await page.locator('#n2-tree-primary tr[data-node-key]').count(), 3);
  assert.equal(await search.inputValue(), '');
  assert.equal(
    JSON.parse(await page.locator('#n2-tree-events').textContent()).length,
    eventsBeforeQuery.length + 1,
  );

  await page.locator('#n2-tree-accept-query').click();
  await search.fill('Beta');
  await page.waitForTimeout(20);
  assert.deepEqual(
    await page
      .locator('#n2-tree-primary tr[data-node-key]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-node-key'))),
    ['string:a', 'string:b'],
  );
  assert.equal(
    await page
      .locator('#n2-tree-primary tr[data-node-key="string:a"]')
      .getAttribute('aria-expanded'),
    'true',
  );

  await page.locator('#n2-tree-primary button[data-sort-column="name"]').click();
  await page.waitForTimeout(20);
  assert.equal(
    await page.locator('#n2-tree-primary th[data-column-id="name"]').getAttribute('aria-sort'),
    'ascending',
  );
  await search.fill('');
  await page.waitForTimeout(20);
  const filter = page.locator('#n2-tree-primary input[aria-label="Filter Name"]');
  await filter.fill('Beta');
  await page.waitForTimeout(20);
  assert.deepEqual(
    await page
      .locator('#n2-tree-primary tr[data-node-key]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-node-key'))),
    ['string:a', 'string:b'],
  );
  const scriptCountBeforeEditor = scriptRequests.length;
  const rowActionsBeforeEdit = JSON.parse(
    await page.locator('#n2-tree-events').textContent(),
  ).filter((event) => event === 'rowAction').length;

  const rootNameCell = page.locator(
    '#n2-tree-primary tr[data-node-key="string:a"] td[data-column-id="name"]',
  );
  await rootNameCell.dblclick();
  const editor = page.locator('#n2-tree-primary [data-tree-editor]');
  await editor.waitFor({ state: 'visible' });
  assert.equal(
    await editor.evaluate(
      (input) => input.getBoundingClientRect().width <= input.closest('td').getBoundingClientRect().width,
    ),
    true,
  );
  await editor.fill('Renamed');
  await editor.press('Enter');
  await page.waitForTimeout(20);
  assert.equal(await editor.count(), 0);
  assert.ok(scriptRequests.length > scriptCountBeforeEditor);

  const scriptCountBeforeExport = scriptRequests.length;
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#n2-tree-export-json').click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'tree-table.json');
  await page.waitForFunction(
    () => document.querySelector('#n2-tree-export-outcome')?.textContent?.includes('downloaded'),
  );
  assert.deepEqual(JSON.parse(await page.locator('#n2-tree-export-outcome').textContent()), {
    status: 'downloaded',
    filename: 'tree-table.json',
    rowCount: 2,
  });
  assert.ok(scriptRequests.length > scriptCountBeforeExport);
  const finalEvents = JSON.parse(await page.locator('#n2-tree-events').textContent());
  assert.equal(finalEvents.filter((event) => event === 'queryChange').length, 5);
  assert.equal(finalEvents.filter((event) => event === 'dataRequest').length, 0);
  assert.equal(finalEvents.filter((event) => event === 'rowAction').length, rowActionsBeforeEdit + 1);
  assert.equal(finalEvents.filter((event) => event === 'editCommit').length, 1);
  assert.equal(finalEvents.filter((event) => event === 'editCancel').length, 0);
  assert.deepEqual(
    finalEvents.filter((event) => event.startsWith('editStateChange:')),
    ['editStateChange:gesture', 'editStateChange:commit'],
  );
  assert.equal(errors.filter((error) => /NG050\d/.test(error)).length, 0);
  assert.deepEqual(errors, []);
  console.log(
    'N2-015I real Chromium certification passed (DOM reused; native table/treegrid; empty/loading/error; RTL logical indentation; narrow containment; optional chunks lazy; editor and JSON export exactly once; deterministic virtual bootstrap; 0 viewport requests; controlled query/expansion/selection/edit/action exactly once; 0 NG050x).',
  );
} finally {
  release?.();
  await browser.close();
}
