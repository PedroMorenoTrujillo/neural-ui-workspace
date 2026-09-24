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
const fixture = mkdtempSync(join(root, '.n2-c3-hydration-'));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 120000,
  });
  if (result.status !== 0)
    throw new Error(`${command} failed:\n${result.stdout.slice(-5000)}\n${result.stderr.slice(-5000)}`);
}

try {
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  const providers = 'provideZonelessChangeDetection(),provideClientHydration(),provideRouter([]),provideNeuralIcons(iconEdit)';
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {provideRouter} from '@angular/router';
import {provideNeuralIcons} from '@neural-icons/angular';
import {iconEdit} from '@neural-icons/core/icons/edit';
import {C3Component} from './n2-c3.component';
bootstrapApplication(C3Component,{providers:[${providers}]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {provideRouter} from '@angular/router';
import {provideNeuralIcons} from '@neural-icons/angular';
import {iconEdit} from '@neural-icons/core/icons/edit';
import {C3Component} from './n2-c3.component';
export default (context:BootstrapContext) => bootstrapApplication(C3Component,{providers:[${providers},provideServerRendering()]},context);
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
  writeFileSync(join(fixture, 'src/n2-c3.component.ts'), `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuMegaMenuComponent,NeuMegaMenuItemDirective,type NeuMegaMenuItem} from '@neural-ui/core/mega-menu';
@Component({selector:'app-root',imports:[NeuMegaMenuComponent,NeuMegaMenuItemDirective],template:\`<main>
  <neu-mega-menu id="c3-menu" ariaLabel="Company navigation" [items]="items()" (itemClick)="record('item:'+$event.key)" (mobileActiveChange)="record('mobile:'+$event)" />
  <neu-mega-menu id="c3-rtl" style="display:block;width:240px;margin-left:800px" ariaLabel="RTL navigation" direction="rtl" orientation="vertical" [items]="rtlItems">
    <ng-template neuMegaMenuItem let-item><span class="c3-item">{{item.label}}</span></ng-template>
  </neu-mega-menu>
  <neu-mega-menu id="c3-perf" ariaLabel="Performance navigation" [items]="perfItems" />
  <button id="c3-current" type="button" (click)="setCurrent()">Apply current</button>
  <button id="c3-outside" type="button">Outside</button>
  <output id="c3-events">{{eventsJson()}}</output><output id="c3-ready">{{ready()}}</output>
</main>\`})
export class C3Component {
  readonly events=signal<string[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly ready=signal(false);
  readonly items=signal<readonly NeuMegaMenuItem[]>([
    {key:'products',label:'Products',kind:'panel',icon:'edit',badge:2,panel:{columns:[
      {key:'a',groups:[{key:'platform',label:'Platform',items:[
        {key:'api',label:'API',kind:'link',routerLink:'/api',icon:'edit',badge:2},
        {key:'run',label:'Run',kind:'command',command:()=>this.record('command:run')},
      ]}]},
      {key:'b',groups:[{key:'resources',label:'Resources',items:[
        {key:'docs',label:'Docs',kind:'link',url:'https://example.test',active:true},
        {key:'locked',label:'Locked',kind:'link',url:'/locked',disabled:true},
      ]}]},
    ]}},
    {key:'company',label:'Company',kind:'panel',panel:{columns:[{key:'c',groups:[{key:'about',label:'About',items:[
      {key:'about-link',label:'About',kind:'link',url:'/about'},
    ]}]}]}},
    {key:'pricing',label:'Pricing',kind:'link',routerLink:'/pricing'},
  ]);
  readonly rtlItems:readonly NeuMegaMenuItem[]=[{key:'rtl-panel',label:'RTL panel',kind:'panel',panel:{columns:[{key:'c',groups:[{key:'g',items:[{key:'rtl-link',label:'RTL link',kind:'link',url:'/rtl'}]}]}]}}];
  readonly perfItems:readonly NeuMegaMenuItem[]=Array.from({length:8},(_,root)=>({
    key:'root-'+root,label:'Root '+root,kind:'panel' as const,panel:{columns:[{key:'column',groups:Array.from({length:4},(_,group)=>({
      key:'group-'+group,label:'Group '+group,items:Array.from({length:2},(_,leaf)=>({
        key:'leaf-'+leaf,label:'Destination '+root+'-'+group+'-'+leaf,kind:'link' as const,url:'/perf/'+root+'/'+group+'/'+leaf,
      })),
    }))}]},
  }));
  constructor(){afterNextRender(()=>this.ready.set(true));}
  record(value:string){this.events.update(events=>[...events,value]);}
  setCurrent(){this.items.update(items=>items.map(item=>item.key==='pricing'?{...item,active:true}:item));}
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
  for (const marker of ['ngh=', 'id="c3-menu"', 'id="c3-rtl"', 'Company navigation', 'Pricing', 'Products', 'neural-icon', 'c3-item'])
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(!html.includes('role="menubar"') && !html.includes('role="menuitem"'), 'SSR retained application-menu semantics');
  assert.match(html, /<output id="c3-events"[^>]*>\[\]<\/output>/, 'SSR emitted an interaction');
  assert.ok(!/<div[^>]*class="neu-mega-menu__panel"/.test(html), 'SSR opened a panel without a gesture');

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
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await page.route('**/*.js', async (route) => { await gate; await route.continue(); });
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'commit' });
      await page.locator('#c3-menu .neu-mega-menu__root-action').first().waitFor({ state: 'attached' });
      await page.evaluate(() => { window.__c3Nodes = ['#c3-menu', '#c3-menu nav', '#c3-menu .neu-mega-menu__root-list', '#c3-menu .neu-mega-menu__root-action'].map((selector) => document.querySelector(selector)); });
      release();
      await page.waitForFunction(() => document.querySelector('#c3-ready')?.textContent === 'true');
      assert.equal(await page.evaluate(() => window.__c3Nodes.every((node, i) => node === document.querySelector(['#c3-menu','#c3-menu nav','#c3-menu .neu-mega-menu__root-list','#c3-menu .neu-mega-menu__root-action'][i]))), true);
      const events = async () => JSON.parse(await page.locator('#c3-events').textContent());
      assert.deepEqual(await events(), []);
      const trigger = page.locator('#c3-menu .neu-mega-menu__root-action').first();
      await trigger.focus();
      await page.keyboard.press('Enter');
      await page.locator('.cdk-overlay-container .neu-mega-menu__panel').waitFor();
      assert.equal(await page.locator('.cdk-overlay-container .neu-mega-menu__panel').count(), 1);
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
      assert.equal(await trigger.evaluate((node) => document.activeElement === node), true);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.cdk-overlay-container a[href="/api"]').evaluate((node) => document.activeElement === node), true);
      assert.equal(await page.locator('.cdk-overlay-container a[aria-current="page"]').textContent().then((text) => text.includes('Docs')), true);
      assert.equal(await page.locator('.cdk-overlay-container a[href="/locked"]').count(), 0);
      await page.locator('.cdk-overlay-container button').click();
      await page.waitForFunction(() => !document.querySelector('.cdk-overlay-container .neu-mega-menu__panel'));
      assert.deepEqual(await events(), ['command:run', 'item:run']);

      await trigger.click();
      await page.locator('.cdk-overlay-container .neu-mega-menu__panel').waitFor();
      const company = page.locator('#c3-menu .neu-mega-menu__root-action').nth(1);
      await company.hover();
      await page.waitForFunction(() => document.querySelector('.cdk-overlay-container .neu-mega-menu__panel')?.textContent?.includes('About'));
      assert.equal(await page.locator('.cdk-overlay-container .neu-mega-menu__panel').count(), 1);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.cdk-overlay-container .neu-mega-menu__panel'));
      assert.equal(await company.evaluate((node) => document.activeElement === node), true);
      await trigger.click();
      await page.locator('.cdk-overlay-container .neu-mega-menu__panel').waitFor();
      await page.mouse.click(1200, 760);
      await page.waitForFunction(() => !document.querySelector('.cdk-overlay-container .neu-mega-menu__panel'));
      await page.waitForTimeout(100);
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false', 'outside pointer did not close the trigger');
      assert.equal(await page.locator('.cdk-overlay-container .neu-mega-menu__panel').count(), 0, 'outside panel remounted');
      assert.deepEqual(await events(), ['command:run', 'item:run']);
      await page.locator('#c3-current').evaluate((node) => node.click());
      assert.equal(await page.locator('#c3-menu a[href="/pricing"]').getAttribute('aria-current'), 'page');
      assert.equal(await page.locator('#c3-menu .neu-mega-menu__root-action').first().getAttribute('aria-expanded'), 'false');

      const rtlTrigger = page.locator('#c3-rtl .neu-mega-menu__root-action').first();
      await rtlTrigger.click();
      const rtlPanel = page.locator('.cdk-overlay-container .neu-mega-menu__panel');
      await rtlPanel.waitFor();
      const rtlTriggerBox = await rtlTrigger.boundingBox();
      const rtlPanelBox = await rtlPanel.boundingBox();
      assert.ok(rtlTriggerBox && rtlPanelBox);
      assert.ok(rtlPanelBox.x + rtlPanelBox.width <= rtlTriggerBox.x + 8, 'RTL vertical panel did not open on logical start side');
      assert.equal(await rtlPanel.getAttribute('dir'), 'rtl');
      assert.equal(await rtlPanel.locator('a').first().textContent().then((text) => text.includes('RTL link')), true);
      await rtlTrigger.focus();
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.cdk-overlay-container .neu-mega-menu__panel'));

      await page.setViewportSize({ width: 500, height: 800 });
      await page.locator('#c3-menu .neu-mega-menu__toggle').waitFor();
      await page.locator('#c3-menu .neu-mega-menu__toggle').click();
      await page.locator('#c3-menu .neu-mega-menu__root-action').first().click();
      await page.locator('#c3-menu .neu-mega-menu__panel').waitFor();
      assert.equal(await page.locator('.cdk-overlay-container .neu-mega-menu__panel').count(), 0);
      assert.equal(await page.locator('#c3-menu .neu-mega-menu__panel').count(), 1);
      assert.deepEqual(await events(), ['command:run', 'item:run', 'mobile:true']);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.locator('.cdk-overlay-container .neu-mega-menu__panel').waitFor();
      assert.equal(await page.locator('#c3-menu .neu-mega-menu__panel').count(), 0);
      assert.equal(await page.locator('.cdk-overlay-container .neu-mega-menu__panel').count(), 1);
      await page.locator('#c3-menu .neu-mega-menu__root-action').first().click();
      await page.waitForFunction(() => !document.querySelector('.cdk-overlay-container .neu-mega-menu__panel'));
      const perf = await page.evaluate(async () => {
        const roots = Array.from(document.querySelectorAll('#c3-perf .neu-mega-menu__root-action'));
        const samples = [];
        let maxMounted = 0;
        for (let index = 0; index < 24; index++) {
          const start = performance.now();
          roots[index % roots.length].click();
          await new Promise(requestAnimationFrame);
          maxMounted = Math.max(maxMounted, document.querySelectorAll('.cdk-overlay-container .neu-mega-menu__panel').length);
          samples.push(performance.now() - start);
          roots[index % roots.length].click();
          await new Promise(requestAnimationFrame);
        }
        samples.sort((a, b) => a - b);
        return { p50: samples[Math.floor(samples.length * 0.5)], p95: samples[Math.floor(samples.length * 0.95)], maxMounted, roots: roots.length };
      });
      assert.equal(perf.roots, 8);
      assert.equal(perf.maxMounted, 1);
      console.log(`C3 representative browser open/close: 8 roots, 4 groups/panel, 64 leaves across model; p50 ${perf.p50.toFixed(1)} ms, p95 ${perf.p95.toFixed(1)} ms, max mounted panels ${perf.maxMounted} (24 samples, includes animation frame)`);
      assert.equal(errors.filter((error) => /NG050\d|NG0\d+|TypeError|ReferenceError/.test(error)).length, 0, errors.join('\n'));
      console.log('C3 SSR/hydration PASS: DOM reused, 0 NG050x, zoneless, native navigation, CDK panel, command exactly once, Escape/outside, hover switch, active owner, mobile inline and breakpoint remount.');
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
