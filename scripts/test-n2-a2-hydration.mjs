import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = mkdtempSync(join(root, '.n2-a2-hydration-'));
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
import {iconBell} from '@neural-icons/core/icons/bell';
import {A2Component} from './n2-a2.component';
bootstrapApplication(A2Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideNeuralIcons(iconBell)]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {provideNeuralIcons} from '@neural-icons/angular';
import {iconBell} from '@neural-icons/core/icons/bell';
import {A2Component} from './n2-a2.component';
export default (context:BootstrapContext) => bootstrapApplication(A2Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering(),provideNeuralIcons(iconBell)]},context);
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
  writeFileSync(join(fixture, 'src/n2-a2.component.ts'), `
import {Component,afterNextRender,inject,signal} from '@angular/core';
import {NeuAlertComponent} from '@neural-ui/core/alert';
import {NeuBadgeComponent} from '@neural-ui/core/badge';
import {NeuChipComponent} from '@neural-ui/core/chip';
import {NeuEmptyStateComponent} from '@neural-ui/core/empty-state';
import {NeuToastContainerComponent,NeuToastService} from '@neural-ui/core/toast';
@Component({selector:'app-root',imports:[NeuAlertComponent,NeuBadgeComponent,NeuChipComponent,NeuEmptyStateComponent,NeuToastContainerComponent],template:\`<main>
  <neu-alert id="a2-info" tone="info" title="Information" icon="bell">Informational alert</neu-alert>
  <neu-alert id="a2-danger" tone="danger" title="Error" [closable]="true" (closed)="onAlertClosed()">Important alert</neu-alert>
  <neu-badge id="a2-badge" [dot]="true">5 unread</neu-badge>
  <neu-chip id="a2-chip" [removable]="true" removeAriaLabel="Remove filter" (removed)="onChipRemoved()">Filter</neu-chip>
  <neu-chip id="a2-disabled" [removable]="true" [disabled]="true">Disabled filter</neu-chip>
  <neu-empty-state id="a2-empty" title="No results" description="Try another query" actionLabel="Reset" (action)="onEmptyAction()" />
  <neu-toast-container id="a2-toasts" />
  <output id="a2-chip-events">{{chipEvents()}}</output><output id="a2-alert-events">{{alertEvents()}}</output><output id="a2-empty-events">{{emptyEvents()}}</output><output id="a2-ready">{{ready()}}</output>
</main>\`})
export class A2Component {
  readonly toast=inject(NeuToastService);
  readonly chipEvents=signal(0);
  readonly alertEvents=signal(0);
  readonly emptyEvents=signal(0);
  readonly ready=signal(false);
  constructor(){
    this.toast.info('Ready',{duration:0});
    this.toast.error('Failed',{duration:0});
    afterNextRender(()=>this.ready.set(true));
  }
  onChipRemoved(){this.chipEvents.update(value=>value+1);}
  onAlertClosed(){this.alertEvents.update(value=>value+1);}
  onEmptyAction(){this.emptyEvents.update(value=>value+1);}
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
  for (const marker of ['ngh=', 'id="a2-info"', 'id="a2-danger"', 'id="a2-badge"', 'id="a2-chip"', 'id="a2-empty"', 'id="a2-toasts"']) assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(html.includes('role="alert"') && html.includes('role="status"'), 'SSR needs both alert and status semantics');
  assert.ok(html.includes('Ready') && html.includes('Failed'), 'SSR must render service-owned toasts');
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
      await page.locator('#a2-chip').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#a2-ready').textContent(), 'false');
      await page.evaluate(() => {
        window.__a2Nodes = ['#a2-info','#a2-danger','#a2-badge','#a2-chip','#a2-empty','#a2-toasts'].map(s => document.querySelector(s));
        window.__a2Svgs = document.querySelectorAll('neural-icon svg').length;
      });
      release();
      await page.waitForFunction(() => document.querySelector('#a2-ready')?.textContent === 'true');
      assert.deepEqual(await page.evaluate(() => window.__a2Nodes.map((node, i) => node === document.querySelector(['#a2-info','#a2-danger','#a2-badge','#a2-chip','#a2-empty','#a2-toasts'][i]))), [true,true,true,true,true,true]);
      assert.equal(await page.evaluate(() => window.__a2Svgs), await page.locator('neural-icon svg').count());
      assert.equal(await page.locator('#a2-info').getAttribute('role'), 'status');
      assert.equal(await page.locator('#a2-danger').getAttribute('role'), 'alert');
      assert.equal(await page.locator('#a2-badge').getAttribute('aria-live'), null);
      assert.equal(await page.locator('#a2-chip-events').textContent(), '0');
      assert.equal(await page.locator('#a2-alert-events').textContent(), '0');
      assert.equal(await page.locator('#a2-empty-events').textContent(), '0');
      assert.equal(await page.locator('#a2-toasts .neu-toast').count(), 2);
      await page.locator('#a2-chip .neu-chip__remove').click();
      await page.waitForFunction(() => document.querySelector('#a2-chip-events')?.textContent === '1');
      assert.equal(await page.locator('#a2-chip .neu-chip__remove').count(), 1, 'parent still owns collection membership');
      await page.evaluate(() => document.querySelector('#a2-disabled .neu-chip__remove').click());
      assert.equal(await page.locator('#a2-chip-events').textContent(), '1');
      await page.locator('#a2-danger .neu-alert__close').click();
      await page.waitForFunction(() => document.querySelector('#a2-alert-events')?.textContent === '1');
      await page.locator('#a2-empty button').click();
      await page.waitForFunction(() => document.querySelector('#a2-empty-events')?.textContent === '1');
      await page.locator('#a2-toasts .neu-toast__close').first().click();
      await page.waitForFunction(() => document.querySelectorAll('#a2-toasts .neu-toast').length === 1);
      assert.deepEqual(errors.filter(x => /NG050|error/i.test(x)), []);
      console.log('A2 Chromium SSR/hydration PASS: five surfaces, DOM reuse, no duplicate SVG, first actions once, service toast dismissal, 0 NG050x');
    } finally { release(); await browser.close(); }
  } finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
} finally { rmSync(fixture, { recursive: true, force: true }); }
