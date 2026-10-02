import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

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
const startedAt = performance.now();
const browserEvidence = { browser: 'Chromium', timingsMs: {}, accessibilityViolations: [] };
async function measure(name, action) {
  const started = performance.now();
  await action();
  browserEvidence.timingsMs[name] = performance.now() - started;
}
const errors = [];
const javascriptRequests = [];
page.on('request', (request) => {
  if (new URL(request.url()).pathname.endsWith('.js')) javascriptRequests.push(request.url());
});
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
  assert.equal(await page.locator('#n2-virtual-events').textContent(), '[]');
  assert.equal(await page.locator('#n2-virtual-ranges').textContent(), '[]');
  assert.equal(await page.locator('#n2-h-events').textContent(), '[]');
  assert.equal(await page.locator('#n2-export-state').textContent(), 'idle');
  assert.equal(await page.locator('#n2-table-h #n2-h-editor').count(), 1);
  assert.equal(await page.locator('#n2-table-h .neu-table2__detail-row').count(), 1);
  assert.equal(await page.locator('#n2-table-h .neu-table2__group-row').count(), 2);
  assert.equal(await page.locator('#n2-table-client-virtual tr[data-row-key]').count(), 50);
  assert.equal(
    await page.locator('#n2-table-remote-virtual-satisfied tr[data-row-key]').count(),
    50,
  );
  assert.equal(
    await page.locator('#n2-table-remote-virtual-unsatisfied tr[data-row-key]').count(),
    0,
  );
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
    window.__n2VirtualNodes = [
      document.querySelector('#n2-table-client-virtual table'),
      document.querySelector('#n2-table-client-virtual tr[data-row-key="0"]'),
      document.querySelector('#n2-table-remote-virtual-satisfied table'),
      document.querySelector('#n2-table-remote-virtual-satisfied tr[data-row-key="0"]'),
    ];
    window.__n2HNodes = [
      document.querySelector('#n2-table-h table'),
      document.querySelector('#n2-table-h #n2-h-editor'),
      document.querySelector('#n2-table-h .neu-table2__detail-row'),
    ];
  });
  release();
  await page.waitForFunction(() => document.querySelector('#n2-ready')?.textContent === 'true');
  browserEvidence.timingsMs.initialHydration = performance.now() - startedAt;
  await page.waitForFunction(
    () => document.querySelector('#n2-remote-events')?.textContent === '["B:initial:1:0"]',
  );
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-virtual-events')?.textContent ===
      '["unsatisfied:initial:1:0:0-50"]',
  );
  await page.waitForFunction(
    () => document.querySelector('#n2-virtual-ranges')?.textContent !== '[]',
  );
  assert.equal(
    JSON.parse(await page.locator('#n2-virtual-events').textContent()).some((event) =>
      event.startsWith('satisfied:'),
    ),
    false,
  );
  assert.equal(
    (await page.locator('#n2-table-client-virtual tr[data-row-key]').count()) < 50,
    true,
  );
  assert.equal(
    await page.locator('#n2-table-client-virtual table').getAttribute('aria-rowcount'),
    '200',
  );
  assert.equal(
    await page.locator('#n2-table-remote-virtual-satisfied table').getAttribute('aria-rowcount'),
    '1000',
  );
  assert.deepEqual(
    await page.evaluate(() => {
      const selectors = [
        '#n2-table-client-virtual table',
        '#n2-table-client-virtual tr[data-row-key="0"]',
        '#n2-table-remote-virtual-satisfied table',
        '#n2-table-remote-virtual-satisfied tr[data-row-key="0"]',
      ];
      return window.__n2VirtualNodes.map(
        (node, index) => node === document.querySelector(selectors[index]),
      );
    }),
    [true, true, true, true],
  );
  browserEvidence.accessibilityViolations = await page.evaluate(() => {
    const violations = [];
    const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
    for (const id of new Set(ids)) {
      if (ids.filter((candidate) => candidate === id).length > 1)
        violations.push(`duplicate-id:${id}`);
    }
    document.querySelectorAll('table').forEach((table, index) => {
      const labelled =
        table.getAttribute('aria-label')?.trim() ||
        table.getAttribute('aria-labelledby')?.trim() ||
        table.querySelector('caption')?.textContent?.trim();
      if (!labelled) violations.push(`table-name:${index}`);
    });
    document.querySelectorAll('th').forEach((header, index) => {
      if (!header.getAttribute('scope')) violations.push(`header-scope:${index}`);
    });
    document.querySelectorAll('button,input,select,textarea').forEach((control, index) => {
      const id = control.getAttribute('id');
      const labelled =
        control.getAttribute('aria-label')?.trim() ||
        control.getAttribute('aria-labelledby')?.trim() ||
        (id ? document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent?.trim() : '') ||
        control.textContent?.trim() ||
        control.getAttribute('title')?.trim();
      if (!labelled) violations.push(`control-name:${control.tagName.toLowerCase()}:${index}`);
    });
    return violations;
  });
  assert.deepEqual(browserEvidence.accessibilityViolations, []);
  const accessibilityTree = await page.locator('#n2-table-primary table').ariaSnapshot();
  assert.match(accessibilityTree, /table "Data table"/);
  assert.deepEqual(
    await page.evaluate(() => {
      const selectors = [
        '#n2-table-h table',
        '#n2-table-h #n2-h-editor',
        '#n2-table-h .neu-table2__detail-row',
      ];
      return window.__n2HNodes.map(
        (node, index) => node === document.querySelector(selectors[index]),
      );
    }),
    [true, true, true],
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
  const initialJavascriptRequests = javascriptRequests.length;
  await page.locator('#n2-export').click();
  await page.waitForFunction(() =>
    document.querySelector('#n2-export-state')?.textContent?.startsWith('generated:1:'),
  );
  assert.equal(
    await page
      .locator('#n2-export-state')
      .textContent()
      .then((value) => value?.startsWith('generated:1:')),
    true,
  );
  assert.equal(javascriptRequests.length, initialJavascriptRequests + 1);
  assert.equal(await page.locator('#n2-output-events').textContent(), '[]');
  await page.locator('#n2-h-query').click();
  await page.waitForFunction(
    () => document.querySelector('#n2-h-events')?.textContent === '["editCancel","editState:none"]',
  );
  assert.equal((await page.locator('#n2-h-events').textContent()).includes('editCommit'), false);
  await measure('editActivation', async () => {
    await page.locator('#n2-h-reset-edit').click();
    await page.locator('#n2-h-editor').waitFor();
  });
  await page.locator('#n2-h-editor').fill('Hydrated Ada');
  await page.locator('#n2-h-save').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-h-events')?.textContent ===
      '["editCancel","editState:none","editCommit","editState:none"]',
  );
  await page.locator('#n2-table-h .neu-table2__expansion-column button').first().click();
  await page.waitForFunction(() =>
    document.querySelector('#n2-h-events')?.textContent?.includes('expansion:false'),
  );
  assert.equal(await page.locator('#n2-table-h .neu-table2__detail-row').count(), 0);
  await page.locator('#n2-table-h .neu-table2__group-row button').first().click();
  await page.waitForFunction(() =>
    document.querySelector('#n2-h-events')?.textContent?.includes('grouping'),
  );
  assert.equal((await page.locator('#n2-h-events').textContent()).includes('dataRequest'), false);
  assert.equal((await page.locator('#n2-h-events').textContent()).includes('queryChange'), false);
  await measure('queryInteraction', async () => {
    await page.locator('#n2-table-primary button[aria-label^="Sort Name"]').click();
    await page.waitForFunction(
      () => document.querySelector('#n2-output-events')?.textContent === '["queryChange"]',
    );
  });
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
  await measure('selection', async () => {
    await page.locator('#n2-table-primary input[aria-label="Select row 3"]').click();
    await page.waitForFunction(() =>
      document.querySelector('#n2-output-events')?.textContent?.includes('selectionChange'),
    );
  });
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
  await measure('virtualScroll', async () => {
    await page.locator('#n2-virtual-scroll').click();
    await page.waitForFunction(
      () =>
        document.querySelector('#n2-virtual-events')?.textContent ===
        '["unsatisfied:initial:1:0:0-50","satisfied:viewport:1:0:150-250"]',
    );
  });
  await page.locator('#n2-virtual-query').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-virtual-events')?.textContent ===
      '["unsatisfied:initial:1:0:0-50","satisfied:viewport:1:0:150-250","satisfied:query:2:1:150-250"]',
  );
  await page.locator('#n2-virtual-retry').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#n2-virtual-events')?.textContent ===
      '["unsatisfied:initial:1:0:0-50","satisfied:viewport:1:0:150-250","satisfied:query:2:1:150-250","satisfied:retry:3:1:150-250"]',
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
  await page.locator('#n2-custom-next').click();
  assert.match(await page.locator('#n2-custom-state').textContent(), /^1:/);
  await page.locator('#n2-custom-filter').click();
  assert.equal(await page.locator('#n2-custom-state').textContent(), '0:1');
  assert.equal(await page.locator('#n2-custom-next').isDisabled(), true);
  await page.locator('#n2-custom-clear').click();
  assert.equal(await page.locator('#n2-custom-next').isDisabled(), false);
  assert.deepEqual(errors, []);
  const evidenceDirectory = process.env.NEU_N2_TABLE_EVIDENCE_DIR ?? '/tmp/n2-table-j-playwright';
  mkdirSync(evidenceDirectory, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: join(evidenceDirectory, 'n2-011j-wide.png') });
  await page.setViewportSize({ width: 320, height: 720 });
  assert.equal(
    await page.evaluate(() =>
      [...document.querySelectorAll('neu-table')].every((table) => {
        const parentWidth = table.parentElement?.getBoundingClientRect().width ?? window.innerWidth;
        return table.getBoundingClientRect().width <= parentWidth + 1;
      }),
    ),
    true,
  );
  await page.screenshot({ path: join(evidenceDirectory, 'n2-011j-narrow.png') });
  await page.evaluate(() =>
    document.querySelector('#n2-table-primary')?.setAttribute('dir', 'rtl'),
  );
  assert.equal(
    await page.evaluate(() =>
      [...document.querySelectorAll('neu-table')].every((table) => {
        const parentWidth = table.parentElement?.getBoundingClientRect().width ?? window.innerWidth;
        return table.getBoundingClientRect().width <= parentWidth + 1;
      }),
    ),
    true,
  );
  await page.locator('#n2-table-primary').screenshot({
    path: join(evidenceDirectory, 'n2-011j-rtl.png'),
  });
  writeFileSync(
    join(process.cwd(), 'baselines/n2-table/final-j-browser.json'),
    `${JSON.stringify(browserEvidence, null, 2)}\n`,
  );
  console.log(
    `N2 Table real zoneless hydration passed: deterministic virtual SSR bootstrap; satisfied range zero duplicate; unsatisfied, viewport, query and retry exact ranged requests; bounded client DOM; DOM reused; zero NG050x; zero mechanical a11y violations; ${browserEvidence.timingsMs.initialHydration.toFixed(1)}ms navigation+hydration`,
  );
} finally {
  release();
  await browser.close();
}
