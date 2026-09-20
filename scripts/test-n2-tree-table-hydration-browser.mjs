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
  assert.equal(await page.locator('#n2-tree-primary table').getAttribute('role'), 'treegrid');
  assert.equal(await page.locator('#n2-tree-primary tr[data-node-key]').count(), 3);
  assert.equal(
    await page.locator('#n2-tree-primary tr[data-node-key="string:a"]').getAttribute('aria-level'),
    '1',
  );
  assert.equal(
    await page.locator('#n2-tree-primary tr[data-node-key="string:b"]').getAttribute('aria-level'),
    '2',
  );
  assert.match(await page.locator('#n2-tree-empty').textContent(), /SSR empty tree/);
  assert.match(await page.locator('#n2-tree-loading').textContent(), /SSR loading tree/);
  assert.match(await page.locator('#n2-tree-error').textContent(), /SSR error tree/);
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
  await page.locator('#n2-tree-parent-write').click();
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#n2-tree-primary tr[data-node-key]').count(), 3);
  assert.equal(await page.locator('#n2-tree-events').textContent(), '[]');
  assert.equal(errors.filter((error) => /NG050\d/.test(error)).length, 0);
  assert.deepEqual(errors, []);
  console.log('N2-015B real Chromium hydration passed (DOM reused, 0 NG050x, 0 outputs).');
} finally {
  release?.();
  await browser.close();
}
