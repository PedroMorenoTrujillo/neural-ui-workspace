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
await page.addInitScript(() => {
  const NativeObserver = window.ResizeObserver;
  window.__b9Observers = [];
  window.ResizeObserver = class extends NativeObserver {
    constructor(callback) { super(callback); window.__b9Observers.push(this); this.disconnected = false; }
    disconnect() { this.disconnected = true; super.disconnect(); }
  };
});
let release;
const gate = new Promise((resolve) => (release = resolve));
await page.route('**/*.js', async (route) => { await gate; await route.continue(); });
const events = async () => JSON.parse(await page.locator('#b9-events').textContent());

try {
  await page.goto(process.env.NEU_N2_HYDRATION_URL, { waitUntil: 'commit' });
  const selectors = ['#b9-ltr', '#b9-rtl', '#b9-vertical', '#b9-native', '#b9-enhanced'];
  await page.locator('#b9-ltr').waitFor({ state: 'attached' });
  assert.equal(await page.locator('#b9-ready').textContent(), 'false');
  assert.deepEqual(await events(), []);
  await page.evaluate((paths) => {
    window.__b9Nodes = paths.map((selector) => document.querySelector(selector));
  }, selectors);
  release();
  await page.waitForFunction(() => document.querySelector('#b9-ready')?.textContent === 'true');
  assert.deepEqual(await page.evaluate((paths) =>
    window.__b9Nodes.map((node, index) => node === document.querySelector(paths[index])),
  selectors), [true, true, true, true, true]);
  assert.deepEqual(await events(), []);
  assert.equal(await page.locator('#b9-ltr .neu-splitter__pane').first().evaluate((el) => el.style.flexBasis), '50%');
  assert.equal(await page.locator('#b9-rtl .neu-splitter__handle').getAttribute('aria-orientation'), 'vertical');
  assert.equal(await page.locator('#b9-vertical .neu-splitter__handle').getAttribute('aria-orientation'), 'horizontal');
  const rtlPaneBoxes = await Promise.all([0, 1].map((index) =>
    page.locator('#b9-rtl .neu-splitter__pane').nth(index).boundingBox()));
  assert.ok(rtlPaneBoxes[0].x > rtlPaneBoxes[1].x, 'pane[0] is physical right in RTL');
  const observers = await page.evaluate(() => window.__b9Observers.length);
  assert.equal(observers, 1);

  const ltrHandle = page.locator('#b9-ltr .neu-splitter__handle');
  const box = await ltrHandle.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2);
  await page.mouse.up();
  await page.waitForFunction(() => JSON.parse(document.querySelector('#b9-events').textContent).some((e) => e.startsWith('accept:')));
  const accepted = (await events()).filter((e) => e.startsWith('accept:'));
  assert.equal(accepted.length, 1);
  assert.ok(Number(accepted[0].split(':')[1]) > 50);
  assert.notEqual(await page.locator('#b9-ltr .neu-splitter__pane').first().evaluate((el) => el.style.flexBasis), '50%');

  await page.locator('#b9-rtl .neu-splitter__handle').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => JSON.parse(document.querySelector('#b9-events').textContent).some((e) => e.startsWith('reject:')));
  const rejected = (await events()).filter((e) => e.startsWith('reject:'));
  assert.deepEqual(rejected, ['reject:48']);
  assert.equal(await page.locator('#b9-rtl .neu-splitter__pane').first().evaluate((el) => el.style.flexBasis), '50%');

  await page.locator('#b9-scroll-to').click();
  await page.waitForFunction(() => JSON.parse(document.querySelector('#b9-events').textContent).includes('scroll:30'));
  assert.equal(await page.locator('#b9-enhanced .neu-scroll-area__viewport').evaluate((el) => el.scrollLeft), -30);
  const bar = page.locator('#b9-enhanced .neu-scroll-area__bar--x');
  const logicalMax = await page.locator('#b9-enhanced .neu-scroll-area__viewport').evaluate((el) =>
    el.scrollWidth - el.clientWidth);
  await bar.focus();
  await page.keyboard.press('End');
  await page.waitForFunction((max) => document.querySelector('#b9-enhanced .neu-scroll-area__bar--x')?.getAttribute('aria-valuenow') === String(max), logicalMax);
  const endThumb = await bar.locator('.neu-scroll-area__thumb').boundingBox();
  const track = await bar.boundingBox();
  assert.ok(endThumb.x < track.x + track.width / 2, 'logical end is physical left in RTL');
  await page.keyboard.press('Home');
  await page.waitForFunction(() => document.querySelector('#b9-enhanced .neu-scroll-area__bar--x')?.getAttribute('aria-valuenow') === '0');
  const startThumb = await bar.locator('.neu-scroll-area__thumb').boundingBox();
  assert.ok(startThumb.x > track.x + track.width / 2, 'logical start is physical right in RTL');
  assert.deepEqual(errors, []);
  const timings = await page.evaluate(() => {
    const sample = (element, makeEvent) => {
      const measurements = [];
      for (let index = 0; index < 100; index++) {
        const start = performance.now();
        element.dispatchEvent(makeEvent(index));
        measurements.push(performance.now() - start);
      }
      measurements.sort((a, b) => a - b);
      return { p50Ms: measurements[49], p95Ms: measurements[94] };
    };
    const handle = document.querySelector('#b9-rtl .neu-splitter__handle');
    const viewport = document.querySelector('#b9-native .neu-scroll-area__viewport');
    return {
      splitterKeyboard: sample(handle, (index) => new KeyboardEvent('keydown', {
        key: index % 2 ? 'ArrowLeft' : 'ArrowRight', bubbles: true,
      })),
      scrollEvent: sample(viewport, () => new Event('scroll', { bubbles: true })),
    };
  });
  console.log(`B9 representative Chromium event dispatch (100 samples, no product claim): ${JSON.stringify(timings)}`);
  console.log('B9 Chromium SSR/hydration PASS: DOM reused, 0 NG050x, controlled accept/reject, one observer, logical RTL scroll');
} finally {
  release();
  await browser.close();
}
