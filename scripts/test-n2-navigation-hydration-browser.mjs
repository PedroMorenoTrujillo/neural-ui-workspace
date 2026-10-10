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
  await page.goto(process.env.NEU_N2_NAVIGATION_HYDRATION_URL ?? 'http://127.0.0.1:4397', {
    waitUntil: 'commit',
  });
  const firstTab = page.locator('#n2-tabs-one [role="tab"]').first();
  await firstTab.waitFor({ state: 'attached' });
  assert.equal(await page.locator('#n2-navigation-ready').textContent(), 'false');
  assert.deepEqual(
    await Promise.all(
      [
        '#n2-tabs-events',
        '#n2-panel-events',
        '#n2-sidebar-events',
        '#n2-sidebar-overlay-requests',
        '#n2-sidebar-opened',
        '#n2-sidebar-closed',
      ].map((id) => page.locator(id).textContent()),
    ),
    ['0', '0', '0', '0', '0', '0'],
  );
  await page.evaluate(() => {
    window.__n2NavigationFirstTab = document.querySelector('#n2-tabs-one [role="tab"]');
    window.__n2SidebarOverlay = document.querySelector('#n2-sidebar-overlay aside');
  });
  release();
  await page.waitForFunction(
    () => document.querySelector('#n2-navigation-ready')?.textContent === 'true',
  );
  assert.equal(
    await page.evaluate(
      () => window.__n2NavigationFirstTab === document.querySelector('#n2-tabs-one [role="tab"]'),
    ),
    true,
  );
  assert.equal(
    await page.evaluate(
      () => window.__n2SidebarOverlay === document.querySelector('#n2-sidebar-overlay aside'),
    ),
    true,
  );
  const ids = await page.locator('[id]').evaluateAll((nodes) => nodes.map((node) => node.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(
    await Promise.all(
      [
        '#n2-tabs-events',
        '#n2-panel-events',
        '#n2-sidebar-events',
        '#n2-sidebar-overlay-requests',
        '#n2-sidebar-opened',
        '#n2-sidebar-closed',
      ].map((id) => page.locator(id).textContent()),
    ),
    ['0', '0', '0', '0', '0', '0'],
  );

  await page.locator('#n2-sidebar-overlay .neu-sidebar__close').click();
  await page.waitForFunction(
    () => document.querySelector('#n2-sidebar-closed')?.textContent === '1',
  );
  assert.equal(await page.locator('#n2-sidebar-overlay-requests').textContent(), '1');

  const secondTab = page.locator('#n2-tabs-one [role="tab"]').nth(1);
  await secondTab.click();
  await page.waitForFunction(() => document.querySelector('#n2-tabs-events')?.textContent === '1');
  assert.equal(await secondTab.getAttribute('aria-selected'), 'true');
  await page.locator('#n2-panel button').first().click();
  await page.waitForFunction(() => document.querySelector('#n2-panel-events')?.textContent === '1');
  await page.locator('#n2-sidebar-toggle').click();
  await page.waitForFunction(
    () => document.querySelector('#n2-sidebar-events')?.textContent === '1',
  );
  await page.locator('#n2-sidebar-overlay-open').click();
  await page.waitForFunction(
    () => document.querySelector('#n2-sidebar-opened')?.textContent === '1',
  );
  await page.locator('#n2-sidebar-overlay-parent-close').click();
  await page.waitForFunction(
    () => document.querySelector('#n2-sidebar-closed')?.textContent === '2',
  );
  assert.equal(await page.locator('#n2-sidebar-overlay-requests').textContent(), '1');
  assert.equal(
    errors.some((error) => /NG050\d/.test(error)),
    false,
    errors.join('\n'),
  );
  assert.deepEqual(errors, []);
  console.log(
    'N2 navigation SSR/hydration passed (DOM reused; IDs unique; first proposals exactly once).',
  );
} finally {
  release();
  await browser.close();
}
