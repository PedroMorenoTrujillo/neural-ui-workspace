import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'sass';
import { chromium, firefox, webkit } from '@playwright/test';

// CSS contract probes complement (not replace) Angular hydration/interaction tests.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const core = join(root, 'projects/ui-core');
const output = join(root, 'release/golden-theme');
mkdirSync(output, { recursive: true });
const base = compile(join(core, 'styles/_tokens.scss')).css;
const files = {
  button: 'button/neu-button.component.scss', input: 'input/neu-input.component.scss',
  textarea: 'textarea/neu-textarea.component.scss', checkbox: 'checkbox/neu-checkbox.component.scss',
  select: 'select/neu-select.component.scss',
  table: 'table/internal/renderer/neu-table-basic-renderer.component.scss',
  'tree-table': 'tree-table/internal/renderer/neu-tree-table-renderer.component.scss',
};
const css = Object.fromEntries(Object.entries(files).map(([name, file]) => [name, compile(join(core, file)).css]));
const palettes = [
  { surface: '#fff4e8', text: '#283345', brand: '#8540a0', foreground: '#fff8e0', hover: '#5b2475', error: '#a52865' },
  { surface: '#122b2b', text: '#edf8e1', brand: '#b7ef9e', foreground: '#163a26', hover: '#81b975', error: '#eead58' },
];
const rgb = hex => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
const evidence = [];
for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await launcher.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    for (const [index, palette] of palettes.entries()) for (const theme of ['light', 'dark']) {
      const tokens = `--neu-surface:${palette.surface};--neu-text:${palette.text};--neu-primary:${palette.brand};--neu-primary-dark:${palette.brand};--neu-primary-solid:${palette.brand};--neu-primary-solid-fg:${palette.foreground};--neu-primary-fg:${palette.foreground};--neu-primary-solid-hover:${palette.hover};--neu-error:${palette.error};--neu-border:${palette.hover};--neu-border-focus:${palette.brand};--neu-input-focus-border:${palette.brand};--neu-focus-ring-width:5px;--neu-focus-ring-alpha:0.4;`;
      async function mount(component, html, local = '') {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.setContent(`<html data-theme="${theme}"><head><style>${base}\n${css[component]}\n*,*::before,*::after{transition:none!important;animation:none!important}</style></head><body><main style="${tokens}${local}">${html}</main></body></html>`);
        await page.mouse.move(1400, 850);
      }
      const styles = selector => page.locator(selector).first().evaluate(el => {
        const s = getComputedStyle(el);
        return { color: s.color, bg: s.backgroundColor, border: s.borderTopColor, borderWidth: s.borderBottomWidth, inlineBorder: s.borderRightWidth, shadow: s.boxShadow, stroke: s.stroke, opacity: s.opacity, height: s.height, maxHeight: s.maxHeight, top: s.top, block: s.paddingBlockStart, inline: s.paddingInlineStart, display: s.display, outline: s.outlineStyle };
      });
      for (const tone of ['brand', 'neutral', 'danger']) for (const variant of ['solid', 'outline', 'ghost']) {
        await mount('button', `<button class="neu-button neu-button--md neu-button--${variant} neu-button--${tone}">Save</button>`);
        const normal = await styles('button');
        const expected = tone === 'danger' ? palette.error : tone === 'brand' ? palette.brand : palette.text;
        assert.equal(variant === 'solid' ? normal.bg : normal.color, rgb(expected), `${engine}/${theme}/${variant}/${tone} semantic color`);
        await page.locator('button').hover();
        const hover = await styles('button');
        if (tone === 'brand' && variant === 'solid') assert.equal(hover.bg, rgb(palette.hover));
        await page.keyboard.press('Tab');
        await page.locator('button').focus();
        const focused = await styles('button');
        assert.notEqual(focused.shadow, 'none', `${engine}/${theme}/${variant}/${tone} Button keyboard focus remains visible`);
        await page.locator('button').evaluate(el => { el.setAttribute('disabled', ''); el.classList.add('neu-button--disabled'); });
        assert.equal((await styles('button')).opacity, '0.45');
        evidence.push({ engine, index, theme, component: 'button', tone, variant, normal, hover, focused });
      }
      await mount('button', '<button disabled aria-busy="true" class="neu-button neu-button--solid neu-button--brand neu-button--loading"><span class="neu-button__spinner"><svg></svg></span>Saving</button>');
      assert.equal(await page.locator('button').isDisabled(), true);
      assert.equal(await page.locator('.neu-button__spinner').isVisible(), true);
      await mount('button', '<button class="neu-button neu-button--solid neu-button--brand">Local</button>', '--neu-button-background:#324567;--neu-button-foreground:#fedcba;--neu-button-border:#456789;--neu-button-background-hover:#223344;');
      assert.equal((await styles('button')).bg, rgb('#324567'));
      assert.equal((await styles('button')).color, rgb('#fedcba'));
      assert.equal((await styles('button')).border, rgb('#456789'));
      await page.locator('button').hover();
      assert.equal((await styles('button')).bg, rgb('#223344'));

      for (const component of ['input', 'textarea', 'select']) {
        const prefix = 'neu-' + component;
        const field = component === 'textarea' ? '<textarea class="neu-textarea__field"></textarea>' : '<input class="' + prefix + '__field" />';
        await mount(component, `<div class="${prefix}__wrapper ${prefix}__wrapper--focused ${prefix}__wrapper--error">${field}<label class="${prefix}__label">Name</label></div>`, '--neu-input-background:#243658;');
        if (component === 'select') {
          await mount(component, '<div class="neu-select neu-select--error"><button class="neu-select__trigger">Choose</button></div>');
          await page.keyboard.press('Tab');
          await page.locator('.neu-select__trigger').focus();
        }
        const target = component === 'textarea' ? 'textarea' : component === 'select' ? '.neu-select__trigger' : '.' + prefix + '__wrapper';
        const result = await styles(target);
        assert.equal(result.border, rgb(palette.error), `${component} keeps error border when focused`);
        assert.ok(result.shadow.includes('5px'), `${component} uses focus geometry`);
        const expectedShadow = await page.locator('main').evaluate(el => {
          const probe = document.createElement('span');
          probe.style.boxShadow = '0 0 0 5px color-mix(in srgb,var(--neu-error) 40%,transparent)';
          el.append(probe); const value = getComputedStyle(probe).boxShadow; probe.remove(); return value;
        });
        assert.equal(result.shadow, expectedShadow, `${component} derives error color`);
        if (component === 'input') assert.equal((await styles('label')).bg, rgb('#243658'));
        evidence.push({ engine, index, theme, component, result });
      }
      const checkboxTemplate = readFileSync(join(core, 'checkbox/neu-checkbox.component.ts'), 'utf8');
      assert.equal(/stroke="white"/.test(checkboxTemplate), false);
      for (const state of ['checked', 'mixed']) {
        await mount('checkbox', `<span class="neu-checkbox__box neu-checkbox__box--${state}"><svg class="neu-checkbox__check"><path stroke="currentColor" /></svg></span>`);
        assert.equal((await styles('path')).stroke, rgb(palette.foreground));
        assert.equal((await styles('.neu-checkbox__box')).bg, rgb(palette.brand));
      }
      for (const component of ['table', 'tree-table']) {
        const prefix = component === 'table' ? 'neu-table2' : 'neu-tree-table2';
        await mount(component, `<div class="${prefix}__viewport ${prefix}__viewport--striped ${prefix}__viewport--sticky-header" data-density="normal" data-borders="none" data-responsive="contained-scroll"><table class="${prefix}__table"><thead><tr><th>Name</th></tr></thead><tbody><tr><td data-column-header="Name">A</td></tr><tr aria-selected="true"><td data-column-header="Name">B</td></tr></tbody></table></div>`, '--neu-table-header-height:73px;--neu-table-max-height:211px;--neu-table-sticky-offset:17px;--neu-table-selected-background:#987654;--neu-tree-table-cell-block:20px;--neu-tree-table-cell-inline:27px;--neu-tree-table-selected-background:#987654;');
        assert.equal((await styles('tr[aria-selected]')).bg, rgb('#987654'), 'Selection wins over striping');
        assert.equal((await styles('thead')).bg, rgb(palette.surface));
        if (component === 'table') {
          assert.equal(await page.locator('th').evaluate(el => el.getBoundingClientRect().height), 73);
          assert.equal((await styles('.' + prefix + '__viewport')).maxHeight, '211px');
          assert.equal((await styles('thead')).top, '17px');
        } else {
          assert.equal((await styles('td')).block, '20px');
          assert.equal((await styles('td')).inline, '27px');
        }
        for (const density of ['compact', 'normal', 'relaxed']) {
          await page.locator('[data-density]').evaluate((el, value) => el.setAttribute('data-density', value), density);
          const padding = (await styles('td')).block;
          if (component === 'tree-table') assert.equal(padding, { compact: '12px', normal: '20px', relaxed: '28px' }[density]);
          evidence.push({ engine, index, theme, component, density, padding });
        }
        for (const borders of ['none', 'rows', 'cells']) {
          await page.locator('[data-borders]').evaluate((el, value) => el.setAttribute('data-borders', value), borders);
          const cell = await styles('td');
          assert.equal(cell.borderWidth, borders === 'none' ? '0px' : '1px');
          assert.equal(cell.inlineBorder, borders === 'cells' ? '1px' : '0px');
        }
        await page.setViewportSize({ width: 390, height: 900 });
        assert.equal((await styles('tbody tr')).display, 'table-row');
        await page.locator('[data-responsive]').evaluate(el => el.setAttribute('data-responsive', 'stacked'));
        assert.equal((await styles('tbody tr')).display, 'grid');
        assert.equal(await page.locator('td').first().evaluate(el => getComputedStyle(el, '::before').content), '"Name"');
        await page.locator('[data-responsive]').evaluate((el, prefix) => el.classList.add(prefix + '__viewport--virtual'), prefix);
        assert.equal((await styles('tbody tr')).display, 'table-row', 'Virtual row geometry takes precedence');
      }
    }
  } finally { await browser.close(); }
}
writeFileSync(join(output, 'results.json'), JSON.stringify({ presets: 2, themes: ['light', 'dark'], engines: ['chromium', 'firefox', 'webkit'], evidence }, null, 2));
console.log(`Golden theme CSS contracts PASS: ${evidence.length} evidence records, two presets, both modes, three engines.`);
