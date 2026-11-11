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

async function assertNestedAccordion() {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const outer = page.locator('#n2-accordion-outer');
  const inner = page.locator('#n2-accordion-inner');
  const outerHeader = outer.getByRole('button', { name: 'Outer accordion', exact: true });
  const innerHeader = inner.getByRole('button', { name: 'Inner accordion', exact: true });
  const innerPanel = inner.locator('[role="region"]');
  const panelId = await innerHeader.getAttribute('aria-controls');
  const headerId = await innerHeader.getAttribute('id');
  assert.ok(panelId && headerId);
  assert.equal(await innerPanel.getAttribute('id'), panelId);
  assert.equal(await innerPanel.getAttribute('aria-labelledby'), headerId);
  assert.notEqual(panelId, await outerHeader.getAttribute('aria-controls'));

  const chevronTransform = (header) => header.locator('.neu-accordion__chevron').evaluate(
    (element) => getComputedStyle(element).transform,
  );
  const expectState = async (expanded) => {
    await page.waitForFunction(({ id, expanded }) => {
      const panel = document.getElementById(id);
      return panel?.getAttribute('aria-hidden') === String(!expanded);
    }, { id: panelId, expanded });
    assert.equal(await innerHeader.getAttribute('aria-expanded'), String(expanded));
    assert.equal(await innerPanel.getAttribute('inert'), expanded ? null : '');
    assert.equal(await outerHeader.getAttribute('aria-expanded'), 'true');
    const panelHeight = await innerPanel.evaluate((panel) => panel.getBoundingClientRect().height);
    const padding = await innerPanel.locator('.neu-accordion__body').evaluate(
      (body) => getComputedStyle(body).padding,
    );
    if (expanded) {
      assert.ok(panelHeight > 0);
      assert.notEqual(padding, '0px');
      assert.equal(await chevronTransform(innerHeader), await chevronTransform(outerHeader));
    } else {
      assert.equal(panelHeight, 0);
      assert.equal(padding, '0px');
      assert.equal(await chevronTransform(innerHeader), 'none');
    }
  };

  assert.notEqual(await chevronTransform(outerHeader), 'none');
  await expectState(false);
  await innerHeader.press('Enter');
  await expectState(true);
  await innerHeader.click();
  await expectState(false);
}

try {
  await page.goto(process.env.NEU_N2_ACCORDION_HYDRATION_URL ?? 'http://127.0.0.1:4396', {
    waitUntil: 'commit',
  });
  const firstHeader = page.locator('#n2-accordion .neu-accordion__header').first();
  await firstHeader.waitFor({ state: 'attached' });
  assert.equal(await page.locator('#n2-accordion-ready').textContent(), 'false');
  assert.equal(await page.locator('#n2-accordion-events').textContent(), '0');
  await page.evaluate(() => {
    window.__n2AccordionHeader = document.querySelector('#n2-accordion .neu-accordion__header');
  });
  release();
  await page.waitForFunction(() => document.querySelector('#n2-accordion-ready')?.textContent === 'true');
  assert.equal(
    await page.evaluate(
      () => window.__n2AccordionHeader === document.querySelector('#n2-accordion .neu-accordion__header'),
    ),
    true,
  );
  assert.equal(await page.locator('#n2-accordion-events').textContent(), '0');
  const secondHeader = page.locator('#n2-accordion .neu-accordion__header').nth(1);
  await secondHeader.click();
  await page.waitForFunction(() => document.querySelector('#n2-accordion-events')?.textContent === '1');
  assert.equal(await secondHeader.getAttribute('aria-expanded'), 'true');
  await page.locator('#n2-accordion .hydrated-body').nth(1).click();
  await page.waitForFunction(
    () => document.querySelector('#n2-accordion-body-events')?.textContent === '1',
  );
  await assertNestedAccordion();
  assert.equal(errors.some((error) => /NG050\d/.test(error)), false, errors.join('\n'));
  assert.deepEqual(errors, []);
  console.log('N2 Accordion SSR/hydration passed (DOM reused; first proposal and typed body action exactly once).');
} finally {
  release();
  await browser.close();
}
