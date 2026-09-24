import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  createReadStream, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = mkdtempSync(join(root, '.n2-c2-hydration-'));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 120000,
  });
  if (result.status !== 0)
    throw new Error(`${command} failed:\n${result.stdout.slice(-5000)}\n${result.stderr.slice(-5000)}`);
}

try {
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {C2Component} from './n2-c2.component';
bootstrapApplication(C2Component,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {C2Component} from './n2-c2.component';
export default (context:BootstrapContext) => bootstrapApplication(C2Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);
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
  writeFileSync(join(fixture, 'src/n2-c2.component.ts'), `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuPickListComponent,NeuOrderListComponent,NeuPickListItemDirective,NeuOrderListItemDirective,type NeuTransferItem} from '@neural-ui/core/pick-list';
@Component({selector:'app-root',imports:[NeuPickListComponent,NeuOrderListComponent,NeuPickListItemDirective,NeuOrderListItemDirective],template:\`<main>
  <button id="c2-accept-pick" type="button" (click)="acceptPick.set(true)">Accept PickList</button>
  <button id="c2-accept-order" type="button" (click)="acceptOrder.set(true)">Accept OrderList</button>
  <neu-pick-list id="c2-pick" dir="rtl" [source]="source()" [target]="target()" [filter]="true"
    sourceFilterValue="match" targetFilterValue="match" [dragDrop]="true"
    (sourceSelectionChange)="onSelection($event)"
    (itemsChange)="onPick($event)">
    <ng-template [neuPickListItem]="source()" let-item><span class="c2-pick-template">{{item.label}}</span></ng-template>
  </neu-pick-list>
  <neu-order-list id="c2-order" [items]="ordered()" [selectionKeys]="['D']" [filter]="true"
    filterValue="match" [dragDrop]="true" (orderChange)="onOrder($event)">
    <ng-template [neuOrderListItem]="ordered()" let-item><span class="c2-order-template">{{item.label}}</span></ng-template>
  </neu-order-list>
  <output id="c2-events">{{eventsJson()}}</output><output id="c2-ready">{{ready()}}</output>
</main>\`})
export class C2Component {
  readonly source=signal<readonly NeuTransferItem[]>([{value:'A',label:'match A'},{value:'B',label:'hidden B'},{value:'C',label:'match C'},{value:'locked',label:'hidden locked',disabled:true}]);
  readonly target=signal<readonly NeuTransferItem[]>([{value:'H',label:'hidden H'},{value:'V',label:'match V'}]);
  readonly ordered=signal<readonly NeuTransferItem[]>([{value:'A',label:'hidden A'},{value:'B',label:'match B'},{value:'C',label:'hidden C'},{value:'D',label:'match D'}]);
  readonly acceptPick=signal(false);
  readonly acceptOrder=signal(false);
  readonly events=signal<string[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly ready=signal(false);
  constructor(){afterNextRender(()=>this.ready.set(true));}
  onPick(next:{source:NeuTransferItem[];target:NeuTransferItem[]}){
    this.events.update(events=>[...events,'pick:'+next.source.map(item=>item.value).join(',')+'|'+next.target.map(item=>item.value).join(',')]);
    if(this.acceptPick()){this.source.set(next.source);this.target.set(next.target);}
  }
  onSelection(items:NeuTransferItem[]){this.events.update(events=>[...events,'selection:'+items.map(item=>item.value).join(',')]);}
  onOrder(next:NeuTransferItem[]){
    this.events.update(events=>[...events,'order:'+next.map(item=>item.value).join(',')]);
    if(this.acceptOrder())this.ordered.set(next);
  }
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
  for (const marker of ['ngh=', 'id="c2-pick"', 'id="c2-order"', 'match A', 'match B', 'match V', 'c2-pick-template', 'c2-order-template'])
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.match(html, /<output id="c2-events"[^>]*>\[\]<\/output>/, 'SSR emitted an interaction proposal');

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
    const page = await browser.newPage({ viewport: { width: 500, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await page.route('**/*.js', async (route) => { await gate; await route.continue(); });
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'commit' });
      await page.locator('#c2-pick .neu-pick-list__column').first().waitFor({ state: 'attached' });
      assert.equal(await page.locator('#c2-pick .neu-pick-list__column').count(), 2);
      assert.equal(await page.locator('#c2-order .neu-order-list__item').count(), 2);
      await page.evaluate(() => { window.__c2Nodes = ['#c2-pick', '#c2-order', '#c2-pick .neu-pick-list__column', '#c2-order .neu-order-list__item'].map((selector) => document.querySelector(selector)); });
      release();
      await page.waitForFunction(() => document.querySelector('#c2-ready')?.textContent === 'true');
      assert.equal(await page.evaluate(() => window.__c2Nodes.every((node,index) => node === document.querySelector(['#c2-pick','#c2-order','#c2-pick .neu-pick-list__column','#c2-order .neu-order-list__item'][index]))), true);
      const events = async () => JSON.parse(await page.locator('#c2-events').textContent());
      assert.deepEqual(await events(), []);
      assert.equal(await page.locator('#c2-pick').getAttribute('dir'), 'rtl');
      assert.equal(await page.locator('#c2-pick .neu-pick-list__column').first().locator('h3').textContent(), 'Available');
      assert.equal(await page.locator('#c2-pick .neu-pick-list__column').last().locator('h3').textContent(), 'Selected');
      assert.equal(await page.locator('#c2-pick .neu-pick-list__actions button[aria-label="Move selected items to target"]').count(), 1);
      assert.equal(await page.locator('#c2-order .neu-order-list__option').first().getAttribute('aria-pressed'), 'false');

      const orderTop = page.locator('#c2-order .neu-order-list__toolbar button[aria-label="Move selected items to top"]');
      await orderTop.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#c2-events')?.textContent?.includes('order:A,D,C,B'));
      assert.deepEqual(await events(), ['order:A,D,C,B']);
      assert.equal(await page.locator('#c2-order .neu-order-list__item').first().textContent().then((text) => text.includes('match B')), true);
      assert.equal(await orderTop.evaluate((node) => document.activeElement === node), true);
      await page.locator('#c2-accept-order').click();
      await orderTop.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#c2-order .neu-order-list__item')?.textContent?.includes('match D'));
      assert.deepEqual(await events(), ['order:A,D,C,B', 'order:A,D,C,B']);
      assert.equal(await orderTop.evaluate((node) => document.activeElement === node), true);

      const orderHandle = page.locator('#c2-order .neu-order-list__drag-handle').first();
      const orderTarget = page.locator('#c2-order .neu-order-list__item').last();
      const orderFromBox = await orderHandle.boundingBox();
      const orderToBox = await orderTarget.boundingBox();
      assert.ok(orderFromBox && orderToBox, 'Missing OrderList CDK geometry');
      await page.mouse.move(orderFromBox.x + orderFromBox.width / 2, orderFromBox.y + orderFromBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(orderFromBox.x + orderFromBox.width / 2 + 30, orderFromBox.y + orderFromBox.height / 2 + 30, { steps: 10 });
      await page.mouse.move(orderToBox.x + orderToBox.width / 2, orderToBox.y + orderToBox.height - 4, { steps: 20 });
      await page.mouse.up();
      await page.waitForFunction(() => document.querySelector('#c2-events')?.textContent?.includes('order:A,B,C,D'));
      assert.deepEqual(await events(), ['order:A,D,C,B', 'order:A,D,C,B', 'order:A,B,C,D']);

      await page.locator('#c2-pick .neu-pick-list__column').first().locator('button[role="option"]').first().click();
      await page.waitForFunction(() => document.querySelector('#c2-pick .neu-pick-list__column button[role="option"]')?.getAttribute('aria-selected') === 'true');
      assert.deepEqual(await events(), ['order:A,D,C,B', 'order:A,D,C,B', 'order:A,B,C,D', 'selection:A']);
      const transfer = page.locator('#c2-pick .neu-pick-list__actions button[aria-label="Move selected items to target"]');
      await transfer.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#c2-events')?.textContent?.includes('pick:B,C,locked|H,V,A'));
      assert.equal(await page.locator('#c2-pick .neu-pick-list__column').first().locator('button[role="option"]').first().getAttribute('aria-selected'), 'true');
      assert.equal(await transfer.evaluate((node) => document.activeElement === node), true);
      assert.equal((await events()).length, 5);
      await page.locator('#c2-accept-pick').click();
      await transfer.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#c2-pick .neu-pick-list__column')?.textContent?.includes('match C') && !document.querySelector('#c2-pick .neu-pick-list__column')?.textContent?.includes('match A'));
      await page.waitForFunction(() => document.activeElement === document.querySelectorAll('#c2-pick .neu-pick-list__column')[1]?.querySelectorAll('button[role="option"]')[1]);
      assert.equal((await events()).length, 6);
      assert.equal(await page.locator('#c2-pick .neu-pick-list__column').first().locator('button[role="option"]').count(), 1);
      assert.equal(await page.locator('#c2-pick .neu-pick-list__column').last().locator('button[role="option"]').count(), 2);
      const dragHandle = page.locator('#c2-pick .neu-pick-list__column').first().locator('.neu-pick-list__drag-handle').first();
      const targetItem = page.locator('#c2-pick .neu-pick-list__column').last().locator('.neu-pick-list__item').first();
      const fromBox = await dragHandle.boundingBox();
      const toBox = await targetItem.boundingBox();
      assert.ok(fromBox && toBox, 'Missing real CDK drag geometry');
      await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(fromBox.x + fromBox.width / 2 + 30, fromBox.y + fromBox.height / 2 + 30, { steps: 10 });
      assert.equal(await page.locator('.cdk-drag-preview').count(), 1);
      await page.mouse.move(toBox.x + 10, toBox.y + 4, { steps: 20 });
      assert.equal(await page.locator('.neu-drop-zone--hover').count(), 1);
      await page.mouse.up();
      await page.waitForFunction(() => document.querySelector('#c2-events')?.textContent?.includes('pick:B,locked|H,C,V,A'));
      assert.equal((await events()).length, 7);
      assert.equal(await page.locator('.cdk-drag-preview').count(), 0);
      await page.locator('#c2-pick .neu-pick-list__column').last().locator('button[role="option"]').nth(1).click();
      await page.waitForFunction(() => document.querySelectorAll('#c2-pick .neu-pick-list__column')[1]?.querySelectorAll('button[role="option"]')[1]?.getAttribute('aria-selected') === 'true');
      const moveBack = page.locator('#c2-pick .neu-pick-list__actions button[aria-label="Move selected items to source"]');
      await page.waitForFunction(() => document.querySelector('#c2-pick .neu-pick-list__actions button[aria-label="Move selected items to source"]')?.disabled === false);
      await moveBack.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#c2-events')?.textContent?.includes('pick:B,locked,V|H,C,A'));
      assert.equal((await events()).length, 8);
      assert.equal(await page.locator('#c2-pick .neu-pick-list__column').first().locator('button[role="option"]').first().evaluate((node) => document.activeElement === node), true);
      assert.equal(errors.filter((error) => /NG050\d|NG0\d+|TypeError|ReferenceError/.test(error)).length, 0, errors.join('\n'));
      console.log('C2 SSR/hydration PASS: DOM reused, 0 NG050x, no SSR proposals, visible-slot keyboard action, real CDK pointer transfer and reverse button transfer, rejected/accepted controlled proposals, RTL, zoneless.');
    } finally {
      release();
      await browser.close();
    }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
