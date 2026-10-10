import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from '@playwright/test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  assert.equal(result.status, 0, `${command}: ${result.stdout.slice(-2500)} ${result.stderr.slice(-2500)}`);
  return result.stdout;
}
const fixture = run(process.execPath, [join(root, 'scripts/prepare-n2-forms-hydration.mjs')]).trim().split(/\r?\n/).at(-1);
assert.ok(fixture?.startsWith(root + '/.n2-forms-hydration-'));
try {
  const configPath = join(fixture, 'tsconfig.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.compilerOptions.paths = { '@neural-ui/core': [join(root, 'dist/neural-ui/core')], '@neural-ui/core/*': [join(root, 'dist/neural-ui/core/*')] };
  writeFileSync(configPath, JSON.stringify(config));
  writeFileSync(join(fixture, 'src/n2-forms-hydration.component.ts'), `
import { Component, afterNextRender, signal } from '@angular/core';
import { NeuInputComponent } from '@neural-ui/core/input';
@Component({selector:'app-root', imports:[NeuInputComponent], template: \`
<main [attr.data-hydrated]="hydrated()">
@for (size of sizes; track size) {
  <neu-input [attr.data-size]="size" [size]="size" [label]="'Amount / Importe'" [value]="value()"
    (valueChange)="value.set($event)" [startIcon]="true" [endIcon]="true">
    <span neu-input-start>€</span><span neu-input-end>EUR</span>
  </neu-input>
}
<output>{{ value() }}</output>
</main>\`})
export class N2FormsHydrationComponent {
  readonly sizes = ['sm','md','lg'] as const;
  readonly value = signal('25');
  readonly hydrated = signal(false);
  constructor() { afterNextRender(() => this.hydrated.set(true)); }
}`);
  run(join(root, 'node_modules/.bin/ng'), ['build'], fixture);
  run(process.execPath, [join(fixture, 'dist/server/server.mjs')], fixture);
  const browserRoot = join(fixture, 'dist/browser');
  const html = readFileSync(join(browserRoot, 'index.html'), 'utf8');
  assert.match(html, /ngh=/);
  assert.equal((html.match(/neu-input-start/g) ?? []).length, 3, 'SSR preserves all prefixes');
  assert.equal((html.match(/neu-input-end/g) ?? []).length, 3, 'SSR preserves all suffixes');
  assert.ok(!html.includes('NotYetImplemented'));
  const server = createServer((req, res) => {
    const relative = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let file = join(browserRoot, relative === '/' ? 'index.html' : relative.slice(1));
    if (!file.startsWith(browserRoot + '/')) { res.writeHead(400); res.end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {'Content-Type': {'.html':'text/html','.js':'text/javascript','.css':'text/css'}[extname(file)] ?? 'application/octet-stream'});
    createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    for (const [name, engine] of Object.entries({chromium, firefox, webkit})) {
      const browser = await engine.launch({headless:true});
      try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        for (const theme of ['light','dark']) {
          await page.goto('http://127.0.0.1:' + server.address().port);
          await page.waitForSelector('main[data-hydrated="true"]');
          await page.locator('html').evaluate((el, value) => el.setAttribute('data-theme', value), theme);
          for (const size of ['sm','md','lg']) {
            const field = page.locator('neu-input[data-size="' + size + '"]');
            assert.equal(await field.locator('[neu-input-start]').textContent(), '€');
            assert.equal(await field.locator('[neu-input-end]').textContent(), 'EUR');
            assert.ok(await field.locator('[neu-input-start]').isVisible());
            assert.ok(await field.locator('[neu-input-end]').isVisible());
            await field.locator('input').fill('42');
            await page.waitForFunction(() => document.querySelector('output')?.textContent === '42');
            assert.equal(await field.locator('input').inputValue(), '42');
            await field.locator('input').fill('25');
          }
        }
        assert.deepEqual(errors, [], `${name} hydration/runtime errors`);
        console.log(`${name}: Input prefix/field/suffix SSR hydration, three sizes, two themes PASS`);
      } finally { await browser.close(); }
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
} finally { rmSync(fixture, {recursive:true,force:true}); }
