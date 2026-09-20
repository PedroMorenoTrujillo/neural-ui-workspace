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
  if (['error', 'warning'].includes(message.type())) {
    errors.push(`${message.type()}: ${message.text()}`);
  }
});
let release;
const gate = new Promise((resolve) => (release = resolve));
await page.route('**/*.js', async (route) => {
  await gate;
  await route.continue();
});

try {
  await page.goto(process.env.NEU_N2_TABLE_HYDRATION_URL ?? 'http://127.0.0.1:4393', {
    waitUntil: 'commit',
  });
  await page.locator('#n2-table-primary table').waitFor({ state: 'attached' });
  assert.equal(await page.locator('#n2-ready').textContent(), 'false');
  assert.equal(await page.locator('#n2-output-events').textContent(), '[]');
  assert.equal(await page.locator('#n2-remote-events').textContent(), '[]');
  assert.equal(
    await page.locator('#n2-table-primary th[data-column-id="name"]').getAttribute('aria-sort'),
    'descending',
  );
  assert.equal(
    await page.locator('#n2-table-primary input[aria-label="Search table"]').inputValue(),
    '',
  );
  assert.equal(
    await page
      .locator('#n2-table-primary button[aria-label="Filter Identifier"]')
      .getAttribute('aria-pressed'),
    'true',
  );
  assert.equal(
    await page
      .locator('#n2-table-primary th[data-column-id="name"] .neu-table2__header-label')
      .textContent(),
    'SSR Name',
  );
  assert.deepEqual(
    await page
      .locator('#n2-table-primary th[data-column-id]')
      .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('data-column-id'))),
    ['name', 'id'],
  );
  assert.equal(
    await page
      .locator('#n2-table-primary th[data-column-id="name"]')
      .evaluate((cell) => cell.style.inlineSize),
    '240px',
  );
  assert.equal(
    await page
      .locator('#n2-table-primary th[data-column-id="name"]')
      .getAttribute('data-column-pin'),
    'start',
  );
  assert.equal(
    await page.locator('#n2-table-primary th[data-column-id="id"]').getAttribute('data-column-pin'),
    'end',
  );
  assert.equal(
    (
      await page
        .locator('#n2-table-primary tr[data-row-key="3"] td[data-column-id="name"]')
        .textContent()
    )?.trim(),
    '0:Linus',
  );
  assert.deepEqual(
    await page
      .locator('#n2-table-remote-satisfied tr[data-row-key]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-row-key'))),
    ['1', '2', '3'],
  );
  assert.equal(
    await page.locator('#n2-table-primary tr[data-row-key="3"]').getAttribute('data-selected'),
    'true',
  );
  assert.equal(
    await page
      .locator('#n2-table-primary tr[data-row-key="3"] input[aria-label="Select row 3"]')
      .isChecked(),
    true,
  );
  assert.equal(
    await page
      .locator('#n2-table-remote-satisfied tr[data-row-key="1"]')
      .getAttribute('data-selected'),
    'true',
  );
  assert.equal(
    await page
      .locator('#n2-table-remote-satisfied tr[data-row-key="2"]')
      .getAttribute('aria-disabled'),
    'true',
  );
  assert.equal(
    await page.locator('#n2-table-single input[aria-label="Select row 1"]').getAttribute('type'),
    'radio',
  );
  assert.equal(
    await page.locator('#n2-table-single input[aria-label="Select row 1"]').isChecked(),
    true,
  );
  assert.match(await page.locator('#n2-table-empty').textContent(), /SSR empty/);
  assert.match(await page.locator('#n2-table-loading').textContent(), /SSR loading/);
  assert.match(await page.locator('#n2-table-error').textContent(), /SSR error/);
  await page.evaluate(() => {
    window.__n2TableNodes = [
      document.querySelector('#n2-table-primary table'),
      document.querySelector('#n2-table-primary thead'),
      document.querySelector('#n2-table-primary tr[data-row-key="3"]'),
      document.querySelector('#n2-table-primary td[data-column-id="name"]'),
    ];
    window.__n2TableIds = [...document.querySelectorAll('#n2-table-primary [id]')].map(
      (node) => node.id,
    );
  });
  release();
  await page.waitForFunction(() => document.querySelector('#n2-ready')?.textContent === 'true');
  await page.waitForFunction(
    () => document.querySelector('#n2-remote-events')?.textContent === '["B:initial:1:0"]',
  );
  assert.equal(
    await page
      .locator('#n2-table-remote-satisfied input[aria-label="Select all rows"]')
      .evaluate((input) => input.indeterminate),
    true,
  );
  assert.deepEqual(
    await page.evaluate(() => {
      const selectors = [
        '#n2-table-primary table',
        '#n2-table-primary thead',
        '#n2-table-primary tr[data-row-key="3"]',
        '#n2-table-primary td[data-column-id="name"]',
      ];
      return window.__n2TableNodes.map(
        (node, index) => node === document.querySelector(selectors[index]),
      );
    }),
    [true, true, true, true],
  );
  assert.deepEqual(
    await page.evaluate(() =>
      [...document.querySelectorAll('#n2-table-primary [id]')].map((node) => node.id),
    ),
    await page.evaluate(() => window.__n2TableIds),
  );
  assert.equal(await page.locator('#n2-output-events').textContent(), '[]');
  await page.locator('#n2-table-primary button[aria-label^="Sort Name"]').click();
  await page.waitForFunction(
    () => document.querySelector('#n2-output-events')?.textContent === '["queryChange"]',
  );
  await page.locator('#n2-table-primary input[aria-label="Search table"]').fill('Ada');
  await page.locator('#n2-table-primary button', { hasText: 'Search' }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-output-events')?.textContent === '["queryChange","queryChange"]',
  );
  await page.locator('#n2-table-primary button[aria-label="Filter Name"]').click();
  await page.locator('#n2-table-primary [data-filter-editor="name"] input').fill('a');
  await page
    .locator('#n2-table-primary [data-filter-editor="name"] button', {
      hasText: 'Apply Name filter',
    })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-output-events')?.textContent ===
      '["queryChange","queryChange","queryChange"]',
  );
  await page.locator('#n2-table-primary button[aria-label="Next page"]').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-output-events')?.textContent ===
      '["queryChange","queryChange","queryChange","queryChange"]',
  );
  assert.equal(
    await page.locator('#n2-output-events').textContent(),
    '["queryChange","queryChange","queryChange","queryChange"]',
  );
  assert.equal(
    await page.locator('#n2-table-primary th[data-column-id="name"]').getAttribute('aria-sort'),
    'descending',
  );
  assert.equal(
    await page.locator('#n2-table-primary input[aria-label="Search table"]').inputValue(),
    '',
  );
  await page.locator('#n2-table-primary input[aria-label="Select row 3"]').click();
  await page.locator('#n2-table-primary button[aria-label="Hide Identifier"]').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-output-events')?.textContent ===
      '["queryChange","queryChange","queryChange","queryChange","selectionChange","layoutChange"]',
  );
  assert.equal(
    await page.locator('#n2-output-events').textContent(),
    '["queryChange","queryChange","queryChange","queryChange","selectionChange","layoutChange"]',
  );
  await page.locator('#n2-table-remote-unsatisfied button[aria-label^="Sort Name"]').click();
  await page.waitForFunction(
    () => document.querySelector('#n2-remote-proposals')?.textContent === '1',
  );
  assert.equal(await page.locator('#n2-remote-events').textContent(), '["B:initial:1:0"]');
  await page.locator('#n2-remote-accept').click();
  await page.locator('#n2-table-remote-unsatisfied button[aria-label^="Sort Name"]').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-remote-events')?.textContent ===
      '["B:initial:1:0","B:query:2:1"]',
  );
  await page.locator('#n2-remote-retry').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-remote-events')?.textContent ===
      '["B:initial:1:0","B:query:2:1","B:retry:3:1"]',
  );
  assert.equal(
    await page.locator('#n2-table-primary tr[data-row-key="3"]').getAttribute('data-selected'),
    null,
  );
  assert.equal(await page.locator('#n2-table-primary th[data-column-id="id"]').count(), 0);
  await page.locator('#n2-reconstruct').click();
  await page.waitForFunction(() => document.querySelector('#n2-interactions')?.textContent === '1');
  assert.deepEqual(
    await page
      .locator('#n2-table-primary tr[data-row-key]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-row-key'))),
    ['2'],
  );
  assert.equal(
    await page.locator('#n2-output-events').textContent(),
    '["queryChange","queryChange","queryChange","queryChange","selectionChange","layoutChange"]',
  );
  assert.equal(
    (await page.locator('#n2-output-events').textContent()).includes('dataRequest'),
    false,
  );
  assert.equal(
    errors.some((error) => /NG050\d/.test(error)),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    'N2 Table real zoneless hydration passed: SSR emitted zero requests; satisfied remote state emitted no duplicate; unsatisfied emitted one initial; rejected/accepted query and retry produced the exact 1/2/3 request sequence; DOM reused and zero NG050x',
  );
} finally {
  release();
  await browser.close();
}
