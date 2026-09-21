import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)(
  process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test',
);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`);
});
let release;
const gate = new Promise((resolve) => (release = resolve));
await page.route('**/*.js', async (route) => {
  await gate;
  await route.continue();
});

try {
  await page.goto(process.env.NEU_N2_TREE_SELECT_HYDRATION_URL ?? 'http://127.0.0.1:4395', {
    waitUntil: 'commit',
  });
  const trigger = page.locator('#n2-tree-select .neu-tree-select__trigger');
  await trigger.waitFor({ state: 'attached' });
  assert.equal(await page.locator('#n2-tree-select-ready').textContent(), 'false');
  assert.equal(await page.locator('#n2-tree-select-events').textContent(), '');
  await page.evaluate(() => {
    window.__n2TreeSelectTrigger = document.querySelector('#n2-tree-select .neu-tree-select__trigger');
  });
  release();
  await page.waitForFunction(
    () => document.querySelector('#n2-tree-select-ready')?.textContent === 'true',
  );
  assert.equal(
    await page.evaluate(
      () =>
        window.__n2TreeSelectTrigger ===
        document.querySelector('#n2-tree-select .neu-tree-select__trigger'),
    ),
    true,
  );
  assert.match(await page.locator('#n2-tree-select .neu-tree-select__value').textContent(), /Root/);
  assert.equal(await page.locator('#n2-tree-select-events').textContent(), '');
  await trigger.click();
  await page.locator('.neu-tree-select__node').nth(1).click();
  await page.waitForFunction(
    () => document.querySelector('#n2-tree-select-events')?.textContent === '2',
  );
  assert.match(await page.locator('#n2-tree-select .neu-tree-select__value').textContent(), /Child/);
  assert.equal(errors.some((error) => /NG050\d/.test(error)), false, errors.join('\n'));
  assert.deepEqual(errors, []);
  console.log('N2 TreeSelect SSR/hydration passed (DOM reused; first value proposal exactly once).');
} finally {
  release();
  await browser.close();
}
