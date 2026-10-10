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
const fixture = mkdtempSync(join(root, '.n2-c4-hydration-'));
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
  const providers = 'provideZonelessChangeDetection(),provideClientHydration(),provideRouter([{path:"home",component:EmptyRoute}])';
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {provideRouter} from '@angular/router';
import {C4Component,EmptyRoute} from './n2-c4.component';
bootstrapApplication(C4Component,{providers:[${providers}]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {provideRouter} from '@angular/router';
import {C4Component,EmptyRoute} from './n2-c4.component';
export default (context:BootstrapContext) => bootstrapApplication(C4Component,{providers:[${providers},provideServerRendering()]},context);
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
  writeFileSync(join(fixture, 'src/n2-c4.component.ts'), `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuCommandPaletteComponent,type NeuCommand} from '@neural-ui/core/command-palette';
@Component({template:''})
export class EmptyRoute {}
@Component({selector:'app-root',imports:[NeuCommandPaletteComponent],template:\`<main>
  <button id="c4-open" type="button" (click)="palette.open()">Open palette</button>
  <button id="c4-outside" type="button">Outside</button>
  <neu-command-palette #palette [commands]="commands()" (commandAction)="record($event.id)" />
  <output id="c4-events">{{eventsJson()}}</output><output id="c4-ready">{{ready()}}</output>
</main>\`})
export class C4Component {
  readonly events=signal<string[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly ready=signal(false);
  readonly commands=signal<readonly NeuCommand[]>([
    {id:'action',kind:'action',label:'Open document',description:'Open current file',group:'Actions',icon:'★',keywords:['file']},
    {id:'disabled',kind:'action',label:'Unavailable',disabled:true,group:'Actions'},
    {id:'router',kind:'router',label:'Home',routerLink:'/home',group:'Navigate'},
    {id:'link',kind:'link',label:'Help',href:'#help',group:'Navigate',shortcut:'⌘H'},
  ]);
  constructor(){afterNextRender(()=>this.ready.set(true));}
  record(value:string){this.events.update(events=>[...events,value]);}
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
  for (const marker of ['ngh=', 'c4-open', 'neu-command-palette', 'c4-events'])
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(!html.includes('role="dialog"'), 'SSR opened a palette without an interaction');
  assert.match(html, /<output id="c4-events"[^>]*>\[\]<\/output>/, 'SSR emitted an action');

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
      await page.locator('neu-command-palette').waitFor({ state: 'attached' });
      await page.evaluate(() => { window.__c4Nodes = ['main','#c4-open','neu-command-palette','#c4-events'].map((selector) => document.querySelector(selector)); });
      release();
      await page.waitForFunction(() => document.querySelector('#c4-ready')?.textContent === 'true');
      assert.equal(await page.evaluate(() => window.__c4Nodes.every((node, i) => node === document.querySelector(['main','#c4-open','neu-command-palette','#c4-events'][i]))), true);
      assert.equal(await page.locator('[role="dialog"]').count(), 0);
      const events = async () => JSON.parse(await page.locator('#c4-events').textContent());
      assert.deepEqual(await events(), []);

      await page.locator('#c4-open').click();
      await page.locator('[role="dialog"]').waitFor();
      assert.equal(await page.locator('[role="dialog"]').count(), 1);
      assert.equal(await page.locator('.neu-cmd__input').evaluate((node) => document.activeElement === node), true);
      assert.equal(await page.locator('.neu-cmd__group-label').count(), 2);
      assert.equal(await page.locator('[aria-disabled="true"]').count(), 1);
      assert.equal(await page.locator('a[href="/home"]').count(), 1);
      assert.equal(await page.locator('[role="listbox"],[role="option"]').count(), 0);
      await page.locator('.neu-cmd__input').fill('open file');
      assert.equal(await page.locator('.neu-cmd__item').count(), 1);
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
      assert.deepEqual(await events(), ['action']);
      assert.equal(await page.locator('#c4-open').evaluate((node) => document.activeElement === node), true);

      await page.keyboard.press('Control+k');
      await page.locator('[role="dialog"]').waitFor();
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
      assert.deepEqual(await events(), ['action']);

      await page.locator('#c4-open').click();
      await page.locator('.neu-cmd__input').fill('missing');
      assert.equal(await page.locator('[role="status"]').count(), 1);
      await page.mouse.click(1100, 700);
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));

      await page.locator('#c4-open').click();
      await page.locator('a[href="#help"]').evaluate((node) => node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true })));
      assert.equal(await page.locator('[role="dialog"]').count(), 1, 'modified link activation closed the palette');
      await page.locator('a[href="#help"]').click();
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
      assert.match(page.url(), /#help$/);
      assert.deepEqual(await events(), ['action']);

      await page.locator('#c4-open').click();
      await page.locator('a[href="/home"]').click();
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
      await page.waitForURL('**/home');
      assert.deepEqual(await events(), ['action']);

      await page.setViewportSize({ width: 390, height: 700 });
      await page.locator('#c4-open').click();
      const dialogBox = await page.locator('[role="dialog"]').boundingBox();
      assert.ok(dialogBox && dialogBox.x >= 0 && dialogBox.x + dialogBox.width <= 390);
      await page.keyboard.press('Escape');
      await page.locator('[role="dialog"]').waitFor({ state: 'detached' });
      await page.locator('main').evaluate((node) => node.setAttribute('dir', 'rtl'));
      await page.locator('#c4-open').click();
      const rtlBox = await page.locator('[role="dialog"]').boundingBox();
      assert.ok(rtlBox && rtlBox.x >= 0 && rtlBox.x + rtlBox.width <= 390);
      await page.keyboard.press('Escape');
      await page.locator('[role="dialog"]').waitFor({ state: 'detached' });
      const openClose = await page.evaluate(async () => {
        const trigger = document.querySelector('#c4-open');
        const samples = [];
        let maxDialogs = 0;
        for (let index = 0; index < 30; index += 1) {
          const start = performance.now();
          trigger.click();
          await new Promise(requestAnimationFrame);
          maxDialogs = Math.max(maxDialogs, document.querySelectorAll('[role="dialog"]').length);
          document.querySelector('.neu-cp-backdrop')?.click();
          await new Promise(requestAnimationFrame);
          samples.push(performance.now() - start);
        }
        samples.sort((a, b) => a - b);
        return {
          p50: samples[Math.floor(samples.length * 0.50)],
          p95: samples[Math.floor(samples.length * 0.95)],
          maxDialogs,
          remainingDialogs: document.querySelectorAll('[role="dialog"]').length,
        };
      });
      assert.equal(openClose.maxDialogs, 1);
      assert.equal(openClose.remainingDialogs, 0);
      console.log(`C4 representative browser open+close (30 samples, two animation frames each): p50 ${openClose.p50.toFixed(1)} ms, p95 ${openClose.p95.toFixed(1)} ms.`);
      assert.equal(errors.filter((error) => /NG050\d|NG0\d+|TypeError|ReferenceError/.test(error)).length, 0, errors.join('\n'));
      console.log('C4 SSR/hydration PASS: DOM reused, 0 NG050x, zoneless, first action exactly once, native href and RouterLink, modified click, focus return, shortcut, Escape/outside, grouped/native results, RTL/mobile.');
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
