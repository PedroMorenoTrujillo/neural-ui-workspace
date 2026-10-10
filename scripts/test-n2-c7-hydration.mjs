import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = mkdtempSync(join(root, '.n2-c7-hydration-'));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 180000,
    env: { ...process.env, PATH: `/opt/homebrew/bin:/usr/bin:/bin:${process.env.PATH}` },
  });
  if (result.status !== 0)
    throw new Error(`${command} failed:\n${result.stdout?.slice(-5000)}\n${result.stderr?.slice(-5000)}`);
}

try {
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  writeFileSync(join(fixture, 'src/styles.css'), `body{font-family:system-ui;margin:1rem}button{margin:.25rem}output{display:block}`);
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {C7Component} from './n2-c7.component';
bootstrapApplication(C7Component,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {C7Component} from './n2-c7.component';
export default (context:BootstrapContext) => bootstrapApplication(C7Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);
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
  writeFileSync(join(fixture, 'src/n2-c7.component.ts'), `
import {Component,afterNextRender,computed,signal,viewChild} from '@angular/core';
import {NeuVirtualListComponent,NeuVirtualItemDirective,type NeuVirtualListRange} from '@neural-ui/core/virtual-list';
interface Item {readonly id:number;readonly label:string}
@Component({selector:'app-root',imports:[NeuVirtualListComponent,NeuVirtualItemDirective],template:\`<main>
  <button id="last" (click)="last()">Last</button>
  <button id="reconstruct" (click)="reconstruct()">Reconstruct</button>
  <button id="reverse" (click)="reverse()">Reverse</button>
  <button id="empty" (click)="items.set([])">Empty</button>
  <button id="restore" (click)="restore()">Restore</button>
  <button id="resize" (click)="rows.update(n=>n===10?11:10)">Resize</button>
  <button id="toggle" (click)="show.set(!show())">Toggle</button>
  <div dir="rtl">
  @if(show()){<neu-virtual-list [items]="items()" [itemKey]="key" [itemSize]="32"
    [visibleRows]="rows()" (rangeChange)="record($event)">
    <ng-template [neuVirtualItem]="items()" [neuVirtualItemKey]="key"
      let-item let-index="index" let-key="key">
      <span class="item-content">{{index}}:{{key.toFixed(0)}}:{{item.label}}</span>
    </ng-template>
  </neu-virtual-list>}
  </div>
  <output id="events">{{eventsJson()}}</output><output id="ready">{{ready()}}</output>
</main>\`})
export class C7Component {
  readonly list=viewChild(NeuVirtualListComponent<Item,number>);
  readonly original=Array.from({length:10000},(_,id)=>({id,label:'Item '+id}));
  readonly items=signal<readonly Item[]>(this.original);
  readonly rows=signal(10);
  readonly show=signal(true);
  readonly ready=signal(false);
  readonly events=signal<readonly NeuVirtualListRange[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly key=(item:Item)=>item.id;
  constructor(){afterNextRender(()=>this.ready.set(true));}
  record(range:NeuVirtualListRange){this.events.update(events=>[...events,range]);}
  last(){this.list()?.scrollTo({key:9999,align:'end'});}
  reconstruct(){this.items.set(this.items().map(item=>({...item,label:'New '+item.id})));}
  reverse(){this.items.set([...this.items()].reverse());}
  restore(){this.items.set(this.original);}
}
`);
  const angularPath = join(fixture, 'angular.json');
  const angular = JSON.parse(readFileSync(angularPath, 'utf8'));
  Object.assign(angular.projects['compatibility-consumer'].architect.build.options, {
    server: 'src/main.server.ts', ssr: { entry: 'src/server.ts' }, prerender: false,
  });
  writeFileSync(angularPath, `${JSON.stringify(angular, null, 2)}\n`);
  const appTsPath = join(fixture, 'tsconfig.app.json');
  const appTs = JSON.parse(readFileSync(appTsPath, 'utf8'));
  appTs.compilerOptions.types = ['node'];
  appTs.include = ['src/main.ts', 'src/main.server.ts', 'src/server.ts', 'src/n2-c7.component.ts'];
  writeFileSync(appTsPath, `${JSON.stringify(appTs, null, 2)}\n`);
  const tsPath = join(fixture, 'tsconfig.json');
  const ts = JSON.parse(readFileSync(tsPath, 'utf8'));
  ts.compilerOptions.paths = {
    '@neural-ui/core': [join(root, 'dist/neural-ui/core')],
    '@neural-ui/core/*': [join(root, 'dist/neural-ui/core/*')],
  };
  writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);
  run(join(root, 'node_modules/.bin/ng'), ['build'], fixture);
  run(process.execPath, [join(fixture, 'dist/server/server.mjs')], fixture);
  const browserRoot = join(fixture, 'dist/browser');
  const html = readFileSync(join(browserRoot, 'index.html'), 'utf8');
  for (const marker of ['ngh=', 'neu-virtual-list', 'role="list"', 'role="listitem"', 'aria-posinset="1"', 'Item 0'])
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.match(html, /<output id="events"[^>]*>\[\]<\/output>/);
  assert.ok((html.match(/role="listitem"/g) ?? []).length <= 14, 'SSR mounted too many rows');
  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    let file = join(browserRoot, requested === '/' ? 'index.html' : requested.slice(1));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': {
      '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    }[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    const { chromium } = createRequire(import.meta.url)(process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => {
      window.__c7Metrics = { listeners: 0, observers: 0, frameCalls: 0 };
      const requestFrame = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) => {
        window.__c7Metrics.frameCalls++;
        return requestFrame(callback);
      };
      const add = EventTarget.prototype.addEventListener;
      const remove = EventTarget.prototype.removeEventListener;
      EventTarget.prototype.addEventListener = function(type, ...args) {
        if(type==='scroll' && this instanceof Element && this.classList.contains('neu-virtual-list__viewport')) window.__c7Metrics.listeners++;
        return add.call(this,type,...args);
      };
      EventTarget.prototype.removeEventListener = function(type, ...args) {
        if(type==='scroll' && this instanceof Element && this.classList.contains('neu-virtual-list__viewport')) window.__c7Metrics.listeners--;
        return remove.call(this,type,...args);
      };
      const RealObserver=window.ResizeObserver;
      window.ResizeObserver=class extends RealObserver {
        constructor(callback){super(callback);window.__c7Metrics.observers++}
        disconnect(){super.disconnect();window.__c7Metrics.observers--}
      };
    });
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await page.route('**/*.js', async (route) => { await gate; await route.continue(); });
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'commit' });
      await page.locator('neu-virtual-list').waitFor({ state: 'attached' });
      await page.evaluate(() => { window.__c7Nodes = ['main', 'neu-virtual-list', '[role="list"]', '[role="listitem"]']
        .map((selector) => document.querySelector(selector)); });
      release();
      await page.waitForFunction(() => document.querySelector('#ready')?.textContent === 'true');
      assert.equal(await page.evaluate(() => window.__c7Nodes.every((node, index) =>
        node === document.querySelector(['main', 'neu-virtual-list', '[role="list"]', '[role="listitem"]'][index]))),
      true, 'SSR DOM not reused');
      const count = () => page.locator('[role="listitem"]').count();
      assert.ok(await count() <= 14);
      let maxMounted = await count();
      assert.equal(await page.locator('[role="listitem"]').first().getAttribute('aria-setsize'), '10000');
      await page.waitForFunction(() => JSON.parse(document.querySelector('#events')?.textContent ?? '[]').length === 1);
      assert.deepEqual(JSON.parse(await page.locator('#events').textContent()), [{ start: 0, end: 10 }]);
      await page.locator('#last').click();
      await page.waitForFunction(() => document.querySelector('[aria-posinset="10000"]'));
      assert.ok(await count() <= 14, '10k DOM bound');
      maxMounted = Math.max(maxMounted, await count());
      const beforeStorm = await page.evaluate(() => ({
        events: JSON.parse(document.querySelector('#events')?.textContent ?? '[]').length,
        frames: window.__c7Metrics.frameCalls,
      }));
      await page.evaluate(() => { const node=document.querySelector('.neu-virtual-list__viewport');
        for(let i=0;i<1000;i++)node.dispatchEvent(new Event('scroll')); });
      await page.waitForTimeout(100);
      assert.ok(await count() <= 14, 'scroll storm DOM bound');
      maxMounted = Math.max(maxMounted, await count());
      const afterStorm = await page.evaluate(() => ({
        events: JSON.parse(document.querySelector('#events')?.textContent ?? '[]').length,
        frames: window.__c7Metrics.frameCalls,
      }));
      assert.equal(afterStorm.events, beforeStorm.events, 'scroll events echoed an unchanged range');
      assert.ok(afterStorm.frames - beforeStorm.frames < 20, 'scroll events were not frame-coalesced');
      const scrollSamples = await page.evaluate(async () => {
        const node = document.querySelector('.neu-virtual-list__viewport');
        const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        const samples = [];
        for (let i = 0; i < 60; i++) {
          const start = performance.now();
          node.scrollTop = (i % 2) * 160000;
          node.dispatchEvent(new Event('scroll'));
          await frame(); await frame();
          samples.push(performance.now() - start);
        }
        return samples;
      });
      await page.locator('#last').click();
      const resizeSamples = await page.evaluate(async () => {
        const button = document.querySelector('#resize');
        const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        const samples = [];
        for (let i = 0; i < 100; i++) {
          const start = performance.now(); button.click();
          await frame(); await frame();
          samples.push(performance.now() - start);
        }
        return samples;
      });
      assert.ok(await count() <= 15, 'resize DOM bound');
      maxMounted = Math.max(maxMounted, await count());
      await page.locator('#reconstruct').click();
      await page.waitForFunction(() => document.querySelector('[aria-posinset="10000"]')?.textContent?.includes('New 9999'));
      await page.locator('#reverse').click();
      await page.waitForFunction(() => document.querySelector('[aria-posinset="10000"]')?.textContent?.includes('New 0'));
      await page.locator('#empty').click();
      await page.waitForFunction(() => document.querySelectorAll('[role="listitem"]').length === 0);
      await page.locator('#restore').click();
      await page.waitForFunction(() => document.querySelectorAll('[role="listitem"]').length > 0);
      const initialSamples = await page.evaluate(async () => {
        const button = document.querySelector('#toggle');
        const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        const samples = [];
        for (let i = 0; i < 100; i++) {
          button.click(); await frame(); await frame();
          const start = performance.now(); button.click();
          await frame(); await frame();
          samples.push(performance.now() - start);
        }
        return samples;
      });
      const metrics = await page.evaluate(() => window.__c7Metrics);
      assert.equal(metrics.listeners, 1, 'exactly one live scroll listener');
      assert.equal(metrics.observers, 1, 'exactly one live observer');
      await page.locator('#toggle').click();
      await page.locator('neu-virtual-list').waitFor({ state: 'detached' });
      await page.waitForFunction(() => window.__c7Metrics.listeners === 0 && window.__c7Metrics.observers === 0);
      assert.equal((await page.evaluate(() => window.__c7Metrics)).listeners, 0);
      assert.equal((await page.evaluate(() => window.__c7Metrics)).observers, 0);
      const eventsAtDestroy = await page.locator('#events').textContent();
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#events').textContent(), eventsAtDestroy, 'late range output after destroy');
      assert.equal(errors.filter((error) => /NG050\d|NG0\d+|TypeError|ReferenceError/.test(error)).length,
        0, errors.join('\n'));
      const quantiles = (samples) => {
        const sorted = samples.toSorted((a, b) => a - b);
        return { p50: sorted[Math.floor(sorted.length * .5)], p95: sorted[Math.floor(sorted.length * .95)] };
      };
      console.log('C7 Chromium fixture timing (ms):', JSON.stringify({
        scrollUpdate: quantiles(scrollSamples), resize: quantiles(resizeSamples),
        createRender: quantiles(initialSamples),
      }));
      console.log(`C7 SSR/hydration PASS: DOM reuse, 0 NG050x, 10k DOM bound (max ${maxMounted}), 100 resize, 1000 scroll, 100 lifecycles, one listener/observer.`);
    } finally { release(); await browser.close(); }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
} finally { rmSync(fixture, { recursive: true, force: true }); }
