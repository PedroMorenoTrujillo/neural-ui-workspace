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
  await page.goto(process.env.NEU_N2_HYDRATION_URL ?? 'http://127.0.0.1:4392', {
    waitUntil: 'commit',
  });
  await page.locator('#n2-input .neu-input__field').waitFor({ state: 'attached' });
  assert.equal(await page.locator('#n2-ready').textContent(), 'false');
  assert.deepEqual(JSON.parse(await page.locator('#n2-input-events').textContent()), []);
  assert.deepEqual(JSON.parse(await page.locator('#n2-checkbox-events').textContent()), []);
  await page.evaluate(() => {
    window.__n2Input = document.querySelector('#n2-input .neu-input__field');
    window.__n2Checkbox = document.querySelector('#n2-checkbox .neu-checkbox__input');
    window.__n2NewControls = [
      document.querySelector('#n2-textarea textarea'),
      document.querySelector('#n2-password input'),
      document.querySelector('#n2-mask input'),
      document.querySelector('#n2-otp input'),
      document.querySelector('#n2-switch input'),
      document.querySelector('#n2-radio input'),
      document.querySelector('#n2-number input'),
      document.querySelector('#n2-knob [role="spinbutton"]'),
      document.querySelector('#n2-date .neu-date-input__field'),
    ];
    window.__n2SelectorControls = [
      document.querySelector('#n2-select-single .neu-select__trigger'),
      document.querySelector('#n2-select-multiple .neu-select__trigger'),
      document.querySelector('#n2-autocomplete-strict .neu-autocomplete__input'),
      document.querySelector('#n2-autocomplete-free .neu-autocomplete__input'),
      document.querySelector('#n2-cascade .neu-cascade-select__trigger'),
      document.querySelector('#n2-listbox-single .neu-listbox__options'),
      document.querySelector('#n2-listbox-multiple .neu-listbox__options'),
      document.querySelector('#n2-toggle-single .neu-toggle-group'),
      document.querySelector('#n2-toggle-multiple .neu-toggle-group'),
      document.querySelector('#n2-input-tags input'),
    ];
  });
  release();
  await page.waitForFunction(() => document.querySelector('#n2-ready')?.textContent === 'true');
  assert.equal(
    await page.evaluate(
      () => window.__n2Input === document.querySelector('#n2-input .neu-input__field'),
    ),
    true,
  );
  assert.equal(
    await page.evaluate(
      () => window.__n2Checkbox === document.querySelector('#n2-checkbox .neu-checkbox__input'),
    ),
    true,
  );
  assert.deepEqual(
    await page.evaluate(() => {
      const selectors = [
        '#n2-textarea textarea',
        '#n2-password input',
        '#n2-mask input',
        '#n2-otp input',
        '#n2-switch input',
        '#n2-radio input',
        '#n2-number input',
        '#n2-knob [role="spinbutton"]',
        '#n2-date .neu-date-input__field',
      ];
      return window.__n2NewControls.map(
        (node, index) => node === document.querySelector(selectors[index]),
      );
    }),
    [true, true, true, true, true, true, true, true, true],
  );
  assert.deepEqual(
    await page.evaluate(() => {
      const selectors = [
        '#n2-select-single .neu-select__trigger',
        '#n2-select-multiple .neu-select__trigger',
        '#n2-autocomplete-strict .neu-autocomplete__input',
        '#n2-autocomplete-free .neu-autocomplete__input',
        '#n2-cascade .neu-cascade-select__trigger',
        '#n2-listbox-single .neu-listbox__options',
        '#n2-listbox-multiple .neu-listbox__options',
        '#n2-toggle-single .neu-toggle-group',
        '#n2-toggle-multiple .neu-toggle-group',
        '#n2-input-tags input',
      ];
      return window.__n2SelectorControls.map(
        (node, index) => node === document.querySelector(selectors[index]),
      );
    }),
    [true, true, true, true, true, true, true, true, true, true],
  );
  assert.equal(await page.locator('#n2-input .neu-input__field').inputValue(), 'server-value');
  assert.equal(await page.locator('#n2-checkbox .neu-checkbox__input').isChecked(), true);
  assert.equal(await page.locator('#n2-textarea textarea').inputValue(), 'server-notes');
  assert.equal(await page.locator('#n2-password input').inputValue(), 'Server1!');
  assert.equal(await page.locator('#n2-mask input').inputValue(), '123-456');
  assert.deepEqual(
    await page.locator('#n2-otp input').evaluateAll((inputs) => inputs.map((input) => input.value)),
    ['1', '2', '3', '4'],
  );
  assert.equal(await page.locator('#n2-switch input').isChecked(), true);
  assert.equal(await page.locator('#n2-radio input').first().isChecked(), true);
  assert.match(await page.locator('#n2-number input').inputValue(), /1\.234,50/);
  assert.equal(await page.locator('#n2-number input').getAttribute('aria-valuenow'), '1234.5');
  assert.equal(
    await page.locator('#n2-knob [role="spinbutton"]').getAttribute('aria-valuenow'),
    '25',
  );
  assert.equal(await page.locator('#n2-date .neu-date-input__field').inputValue(), '29/03/2026');
  assert.match(await page.locator('#n2-select-single .neu-select__value').textContent(), /Hydrated one/);
  assert.match(await page.locator('#n2-select-multiple .neu-select__value').textContent(), /Hydrated one/);
  assert.equal(await page.locator('#n2-autocomplete-strict .neu-autocomplete__input').inputValue(), 'Hydrated one');
  assert.equal(await page.locator('#n2-autocomplete-free .neu-autocomplete__input').inputValue(), 'hydrated draft');
  assert.match(await page.locator('#n2-cascade .neu-cascade-select__value').textContent(), /Hydrated one/);
  assert.equal(await page.locator('#n2-listbox-single .neu-listbox__option').first().getAttribute('aria-selected'), 'true');
  assert.equal(await page.locator('#n2-listbox-multiple .neu-listbox__option').first().getAttribute('aria-selected'), 'true');
  assert.match(await page.locator('#n2-toggle-single .neu-toggle-group__btn').first().getAttribute('aria-pressed'), /true/);
  assert.match(await page.locator('#n2-toggle-multiple .neu-toggle-group__btn').first().getAttribute('aria-pressed'), /true/);
  assert.match(await page.locator('#n2-input-tags .neu-input-tags__item-label').textContent(), /Hydrated one/);
  assert.equal(
    await page.locator('#n2-readonly-input .neu-input__field').getAttribute('readonly'),
    '',
  );
  assert.equal(await page.locator('#n2-disabled-input .neu-input__field').isDisabled(), true);
  await page.locator('#n2-textarea textarea').fill('client-notes');
  await page.locator('#n2-password input').fill('Client1!');
  await page.locator('#n2-mask input').fill('987654');
  await page
    .locator('#n2-otp input')
    .first()
    .evaluate((input) => {
      const event = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => '9876' } });
      input.dispatchEvent(event);
    });
  await page.locator('#n2-switch input').focus();
  await page.keyboard.press('Space');
  await page.locator('#n2-radio input').nth(1).focus();
  await page.keyboard.press('Space');
  await page.locator('#n2-number input').fill('2.345,5');
  await page.locator('#n2-knob [role="spinbutton"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.locator('#n2-date .neu-date-input__field').fill('2026-03-30');
  await page.waitForFunction(
    () =>
      JSON.parse(document.querySelector('#n2-new-control-events')?.textContent ?? '[]').length >=
      9,
  );
  assert.deepEqual(JSON.parse(await page.locator('#n2-new-control-events').textContent()), [
    'textarea:client-notes',
    'password:Client1!',
    'mask:987-654',
    'otp:9876',
    'switch:false',
    'radio:user',
    'number:2345.5',
    'knob:30',
    'date:2026-03-30',
  ]);

  await page.locator('#n2-select-single .neu-select__trigger').click();
  await page.locator('.neu-select__panel .neu-select__option').nth(1).click();
  await page.locator('#n2-select-multiple .neu-select__trigger').click();
  await page.locator('.neu-select__panel .neu-select__option').nth(1).click();
  await page.keyboard.press('Escape');
  await page.locator('#n2-autocomplete-strict .neu-autocomplete__dropdown').click();
  await page.locator('.neu-autocomplete__option').filter({ hasText: 'Hydrated two' }).click();
  await page.locator('#n2-autocomplete-free .neu-autocomplete__input').fill('client draft');
  await page.keyboard.press('Escape');
  await page.locator('#n2-cascade .neu-cascade-select__trigger').click();
  await page.locator('.neu-cascade-select__option').nth(1).click();
  await page.locator('#n2-listbox-single .neu-listbox__option').nth(1).click();
  await page.locator('#n2-listbox-multiple .neu-listbox__option').nth(1).click();
  await page.locator('#n2-toggle-single .neu-toggle-group__btn').nth(1).click();
  await page.locator('#n2-toggle-multiple .neu-toggle-group__btn').nth(1).click();
  await page.locator('#n2-input-tags input').fill('Hydrated two');
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () =>
      JSON.parse(document.querySelector('#n2-new-control-events')?.textContent ?? '[]').length ===
      19,
  );
  assert.deepEqual(JSON.parse(await page.locator('#n2-new-control-events').textContent()), [
    'textarea:client-notes',
    'password:Client1!',
    'mask:987-654',
    'otp:9876',
    'switch:false',
    'radio:user',
    'number:2345.5',
    'knob:30',
    'date:2026-03-30',
    'select-single:2',
    'select-multiple:[1,2]',
    'autocomplete-strict:2',
    'autocomplete-free:client draft',
    'cascade:2',
    'listbox-single:2',
    'listbox-multiple:[1,2]',
    'toggle-single:2',
    'toggle-multiple:[1,2]',
    'input-tags:[1,2]',
  ]);
  assert.equal(
    await page.locator('#n2-invalid-input .neu-input__field').getAttribute('aria-invalid'),
    'true',
  );
  assert.equal(
    await page.locator('#n2-readonly-checkbox .neu-checkbox__input').getAttribute('aria-readonly'),
    'true',
  );
  assert.equal(await page.locator('#n2-disabled-checkbox .neu-checkbox__input').isDisabled(), true);

  await page.locator('#n2-input .neu-input__field').fill('hydrated-edit');
  await page.locator('#n2-checkbox .neu-checkbox__input').evaluate((checkbox) => checkbox.focus());
  await page.keyboard.press('Space');
  await page.waitForFunction(() =>
    document.querySelector('#n2-input-events')?.textContent?.includes('hydrated-edit'),
  );
  await page.waitForFunction(() =>
    document.querySelector('#n2-checkbox-events')?.textContent?.includes('false'),
  );
  assert.deepEqual(JSON.parse(await page.locator('#n2-input-events').textContent()), [
    'hydrated-edit',
  ]);
  assert.deepEqual(JSON.parse(await page.locator('#n2-checkbox-events').textContent()), [false]);
  assert.deepEqual(errors, []);
  console.log(
    'N2 Forms real zoneless hydration passed for all 21 controls: DOM reused, explicit locale stable, zero hydration errors, first edits exactly once',
  );
} finally {
  release();
  await browser.close();
}
