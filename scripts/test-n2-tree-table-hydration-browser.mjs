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
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
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
  assert.equal(await page.locator('#n2-tree-primary table').getAttribute('role'), 'treegrid');
  assert.equal(
    await page.locator('#n2-tree-primary table').getAttribute('aria-multiselectable'),
    'true',
  );
  assert.equal(await page.locator('#n2-tree-primary table').getAttribute('tabindex'), '-1');
  assert.equal(await page.locator('#n2-tree-primary tr[data-node-key]').count(), 3);
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
      .locator('#n2-tree-primary tr[data-node-key="string:a"] input[data-selection-indicator]')
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
    ];
  });
  release();
  await page.waitForFunction(
    () => document.querySelector('#n2-tree-ready')?.textContent === 'true',
  );
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
      ];
      return window.__n2TreeNodes.map(
        (node, index) => node === document.querySelector(selectors[index]),
      );
    }),
    [true, true, true, true],
  );
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
    '#n2-tree-primary tr[data-node-key="string:b"] input[data-selection-indicator]',
  );
  await childSelection.click();
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
  await childSelection.click();
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
      .locator('#n2-tree-primary tr[data-node-key="string:a"] input[data-selection-indicator]')
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
  const finalEvents = JSON.parse(await page.locator('#n2-tree-events').textContent());
  assert.equal(finalEvents.filter((event) => event === 'queryChange').length, 5);
  assert.equal(finalEvents.filter((event) => event === 'dataRequest').length, 0);
  assert.equal(errors.filter((error) => /NG050\d/.test(error)).length, 0);
  assert.deepEqual(errors, []);
  console.log(
    'N2-015F real Chromium hydration passed (DOM reused, satisfied remote 0 requests, unsatisfied roots 1 request, accepted expansion 1 child request, controlled query/expansion/selection exactly once, deterministic focus transitions, 0 NG050x).',
  );
} finally {
  release?.();
  await browser.close();
}
