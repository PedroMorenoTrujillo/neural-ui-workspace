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
const events = async () => JSON.parse(await page.locator('#n2-b8-events').textContent());
const waitForEvents = async (count) => page.waitForFunction((expected) =>
  JSON.parse(document.querySelector('#n2-b8-events')?.textContent ?? '[]').length === expected,
count);

try {
  await page.goto(process.env.NEU_N2_HYDRATION_URL, { waitUntil: 'commit' });
  const selectors = [
    '#n2-b8-empty input', '#n2-b8-partial input',
    '#n2-b8-readonly input', '#n2-b8-disabled input',
  ];
  await page.locator(selectors[0]).waitFor({ state: 'attached' });
  assert.equal(await page.locator('#n2-ready').textContent(), 'false');
  assert.deepEqual(await events(), []);
  assert.deepEqual(await Promise.all(selectors.map((selector) => page.locator(selector).inputValue())), [
    '', '12/3', '12/34', '12/34',
  ]);
  await page.evaluate((paths) => {
    window.__n2B8Nodes = paths.map((selector) => document.querySelector(selector));
  }, selectors);
  release();
  await page.waitForFunction(() => document.querySelector('#n2-ready')?.textContent === 'true');
  assert.deepEqual(await page.evaluate((paths) =>
    window.__n2B8Nodes.map((node, index) => node === document.querySelector(paths[index])),
  selectors), [true, true, true, true]);
  assert.deepEqual(await events(), []);
  assert.equal(await page.locator(selectors[2]).getAttribute('readonly'), '');
  assert.equal(await page.locator(selectors[3]).isDisabled(), true);

  const empty = page.locator(selectors[0]);
  await empty.focus();
  await page.keyboard.type('1');
  await waitForEvents(1);
  assert.equal(await empty.inputValue(), '1');
  assert.equal(await empty.evaluate((input) => input.selectionStart), 1);
  assert.deepEqual(await events(), ['empty:1']);

  await empty.evaluate((input) => {
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '12';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  });
  await waitForEvents(2);
  assert.equal(await empty.inputValue(), '12');
  assert.deepEqual(await events(), ['empty:1', 'empty:12']);

  await page.locator(selectors[1]).evaluate((input) => {
    input.setSelectionRange(3, 4);
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => '4' } });
    input.dispatchEvent(event);
  });
  await waitForEvents(3);
  assert.equal(await page.locator(selectors[1]).inputValue(), '12/4');
  assert.deepEqual(await events(), ['empty:1', 'empty:12', 'partial:12/4']);

  await page.locator('#n2-b8-external').click();
  await waitForEvents(4);
  assert.equal(await empty.inputValue(), '34/56');
  assert.deepEqual(await events(), ['empty:1', 'empty:12', 'partial:12/4', 'empty:34/56']);
  assert.deepEqual(errors, []);
  console.log('B8 InputMask real Chromium SSR/hydration PASS: reused DOM, 0 NG050x, first key/paste/IME once, external write once');
} finally {
  release();
  await browser.close();
}
