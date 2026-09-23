import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = mkdtempSync(join(root, '.n2-a1-hydration-'));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stdout.slice(-3500)}\n${result.stderr.slice(-3500)}`);
}

try {
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {provideNeuralIcons} from '@neural-icons/angular';
import {iconSave} from '@neural-icons/core/icons/save';
import {iconDownload} from '@neural-icons/core/icons/download';
import {iconCheck} from '@neural-icons/core/icons/check';
import {A1Component} from './n2-a1.component';
bootstrapApplication(A1Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideNeuralIcons(iconSave,iconDownload,iconCheck)]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {provideNeuralIcons} from '@neural-icons/angular';
import {iconSave} from '@neural-icons/core/icons/save';
import {iconDownload} from '@neural-icons/core/icons/download';
import {iconCheck} from '@neural-icons/core/icons/check';
import {A1Component} from './n2-a1.component';
export default (context:BootstrapContext) => bootstrapApplication(A1Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering(),provideNeuralIcons(iconSave,iconDownload,iconCheck)]},context);
`);
  writeFileSync(join(fixture, 'src/server.ts'), `
import {renderApplication} from '@angular/platform-server';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import bootstrap from './main.server';
const dir=new URL('../browser/',import.meta.url),csr=new URL('index.csr.html',dir);
const document=readFileSync(existsSync(csr)?csr:new URL('index.html',dir),'utf8');
const html=await renderApplication(bootstrap,{document,url:'http://localhost/',allowedHosts:['localhost']});
if(!html.includes('ngh=')) throw new Error('Missing hydration annotations');
writeFileSync(new URL('index.html',dir),html);
`);
  writeFileSync(join(fixture, 'src/n2-a1.component.ts'), `
import {Component,afterNextRender,signal} from '@angular/core';
import {NeuButtonComponent} from '@neural-ui/core/button';
import {NeuButtonGroupComponent} from '@neural-ui/core/button-group';
import {NeuTagComponent} from '@neural-ui/core/tag';
import {NeuToolbarComponent} from '@neural-ui/core/toolbar';
@Component({selector:'app-root',imports:[NeuButtonComponent,NeuButtonGroupComponent,NeuTagComponent,NeuToolbarComponent],template:\`<main>
  <form id="a1-form" (submit)="onSubmit($event)">
    <button neu-button id="a1-normal" icon="save" (neuClick)="onAction()">Save</button>
    <button neu-button id="a1-end" icon="download" iconPosition="end">Download</button>
    <button neu-button id="a1-only" icon="save" [iconOnly]="true" ariaLabel="Save item"></button>
    <button neu-button id="a1-disabled" [disabled]="true" (neuClick)="onAction()">Disabled</button>
    <button neu-button id="a1-loading" [loading]="true" (neuClick)="onAction()">Loading</button>
    <button neu-button id="a1-submit" type="submit">Submit</button>
  </form>
  <neu-button-group id="a1-group" ariaLabel="Grouped actions" dir="rtl"><button neu-button id="a1-group-first">First</button><button neu-button id="a1-group-last">Last</button></neu-button-group>
  <neu-tag id="a1-tag" value="Ready" icon="check" tone="success" />
  <neu-toolbar id="a1-toolbar" dir="rtl"><button neu-toolbar-start id="a1-toolbar-first">One</button><button neu-toolbar-end id="a1-toolbar-last">Two</button></neu-toolbar>
  <output id="a1-actions">{{actions()}}</output><output id="a1-submits">{{submits()}}</output><output id="a1-ready">{{ready()}}</output>
</main>\`})
export class A1Component {
  readonly actions=signal(0);
  readonly submits=signal(0);
  readonly ready=signal(false);
  constructor(){afterNextRender(()=>this.ready.set(true));}
  onAction(){this.actions.update(value=>value+1);}
  onSubmit(event:Event){event.preventDefault();this.submits.update(value=>value+1);}
}
`);
  const angularPath = join(fixture, 'angular.json');
  const angular = JSON.parse(readFileSync(angularPath, 'utf8'));
  Object.assign(angular.projects['compatibility-consumer'].architect.build.options, { server: 'src/main.server.ts', ssr: { entry: 'src/server.ts' }, prerender: false });
  writeFileSync(angularPath, `${JSON.stringify(angular, null, 2)}\n`);
  const appTsPath = join(fixture, 'tsconfig.app.json');
  const appTs = JSON.parse(readFileSync(appTsPath, 'utf8'));
  appTs.compilerOptions.types = ['node'];
  writeFileSync(appTsPath, `${JSON.stringify(appTs, null, 2)}\n`);
  const tsPath = join(fixture, 'tsconfig.json');
  const ts = JSON.parse(readFileSync(tsPath, 'utf8'));
  ts.compilerOptions.paths = { '@neural-ui/core': [join(root, 'dist/neural-ui/core')], '@neural-ui/core/*': [join(root, 'dist/neural-ui/core/*')] };
  writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);
  run(join(root, 'node_modules/.bin/ng'), ['build'], fixture);
  run(process.execPath, [join(fixture, 'dist/server/server.mjs')], fixture);
  const browserRoot = join(fixture, 'dist/browser');
  const html = readFileSync(join(browserRoot, 'index.html'), 'utf8');
  for (const marker of ['ngh=', 'id="a1-normal"', 'id="a1-group"', 'id="a1-tag"', 'id="a1-toolbar"']) assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(html.includes('type="button"') && html.includes('type="submit"'), 'SSR must preserve native button types');
  assert.ok(html.includes('<svg'), 'SSR must render selectively registered icon geometry');
  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    let file = join(browserRoot, requested === '/' ? 'index.html' : requested.slice(1));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    const { chromium } = createRequire(import.meta.url)(process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/*.js', async route => { await gate; await route.continue(); });
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'commit' });
      await page.locator('#a1-normal').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#a1-ready').textContent(), 'false');
      await page.locator('#a1-normal').focus();
      await page.evaluate(() => {
        window.__a1Nodes = ['#a1-normal','#a1-end','#a1-only','#a1-group','#a1-tag','#a1-toolbar'].map(s => document.querySelector(s));
        window.__a1Svgs = document.querySelectorAll('neural-icon svg').length;
      });
      release();
      await page.waitForFunction(() => document.querySelector('#a1-ready')?.textContent === 'true');
      assert.deepEqual(await page.evaluate(() => window.__a1Nodes.map((node, i) => node === document.querySelector(['#a1-normal','#a1-end','#a1-only','#a1-group','#a1-tag','#a1-toolbar'][i]))), [true,true,true,true,true,true]);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'a1-normal');
      assert.equal(await page.evaluate(() => window.__a1Svgs), await page.locator('neural-icon svg').count());
      assert.equal(await page.locator('#a1-actions').textContent(), '0');
      assert.equal(await page.locator('#a1-submits').textContent(), '0');
      assert.equal(await page.locator('#a1-normal').getAttribute('type'), 'button');
      assert.equal(await page.locator('#a1-submit').getAttribute('type'), 'submit');
      assert.equal(await page.locator('#a1-only').getAttribute('aria-label'), 'Save item');
      assert.equal(await page.locator('#a1-normal neural-icon').getAttribute('aria-hidden'), 'true');
      assert.equal(await page.locator('#a1-group [role="group"]').getAttribute('aria-label'), 'Grouped actions');
      assert.equal(await page.locator('#a1-tag button').count(), 0);
      assert.equal(await page.locator('#a1-tag neural-icon svg').count(), 1);
      assert.deepEqual(await page.locator('#a1-toolbar button').evaluateAll(buttons => buttons.map(button => button.id)), ['a1-toolbar-first','a1-toolbar-last']);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'a1-end');
      assert.equal(await page.locator('#a1-end').evaluate(button => button.matches(':focus-visible')), true);
      await page.locator('#a1-normal').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#a1-actions')?.textContent === '1');
      await page.keyboard.press('Space');
      await page.waitForFunction(() => document.querySelector('#a1-actions')?.textContent === '2');
      assert.equal(await page.locator('#a1-submits').textContent(), '0');
      await page.evaluate(() => { document.querySelector('#a1-disabled').click(); document.querySelector('#a1-loading').click(); });
      assert.equal(await page.locator('#a1-actions').textContent(), '2');
      assert.equal(await page.locator('#a1-loading').isDisabled(), true);
      assert.equal(await page.locator('#a1-loading').getAttribute('aria-busy'), 'true');
      assert.deepEqual(errors.filter(x => /NG050|error/i.test(x)), []);
      console.log('A1 Chromium SSR/hydration PASS: four surfaces, DOM reuse, focus, native keyboard, exactly-once actions, selective SVG, 0 NG050x');
    } finally { release(); await browser.close(); }
  } finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
} finally { rmSync(fixture, { recursive: true, force: true }); }
