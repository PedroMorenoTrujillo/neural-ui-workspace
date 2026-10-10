import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = mkdtempSync(join(root, '.n2-b5-hydration-'));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stdout.slice(-3500)}\n${result.stderr.slice(-3500)}`);
}

try {
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {provideNeuralUI} from '@neural-ui/core';
import {B5Component} from './n2-b5.component';
bootstrapApplication(B5Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideNeuralUI()]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {provideNeuralUI} from '@neural-ui/core';
import {B5Component} from './n2-b5.component';
export default (context:BootstrapContext) => bootstrapApplication(B5Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering(),provideNeuralUI()]},context);
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
  writeFileSync(join(fixture, 'src/n2-b5.component.ts'), `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuCompareComponent,NeuCompareHandleComponent,NeuCompareIndicatorComponent,NeuCompareItemComponent} from '@neural-ui/core/compare';
@Component({selector:'app-root',imports:[NeuCompareComponent,NeuCompareHandleComponent,NeuCompareIndicatorComponent,NeuCompareItemComponent],template:\`<main>
  <neu-compare id="b5-ltr" [value]="ltr()" [step]="10" style="display:block;width:200px;height:100px" (valueChange)="accept($event.value)">
    <neu-compare-item position="before"><span>Before</span></neu-compare-item><neu-compare-item position="after"><span>After</span></neu-compare-item><neu-compare-indicator /><neu-compare-handle ariaLabel="Reveal LTR" />
  </neu-compare>
  <neu-compare id="b5-rtl" dir="rtl" [value]="20" [step]="10" style="display:block;width:200px;height:100px" (valueChange)="reject($event.value)">
    <neu-compare-item position="before"><span>Before RTL</span></neu-compare-item><neu-compare-item position="after"><span>After RTL</span></neu-compare-item><neu-compare-indicator /><neu-compare-handle ariaLabel="Reveal RTL" />
  </neu-compare>
  <neu-compare id="b5-vertical" orientation="vertical" [value]="30" style="display:block;width:100px;height:200px"><neu-compare-item position="before">Top</neu-compare-item><neu-compare-item position="after">Bottom</neu-compare-item><neu-compare-handle ariaLabel="Reveal vertical" /></neu-compare>
  <output id="b5-events">{{eventsJson()}}</output><output id="b5-ready">{{ready()}}</output>
</main>\`})
export class B5Component {
  readonly ltr=signal(20);
  readonly events=signal<string[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly ready=signal(false);
  constructor(){afterNextRender(()=>this.ready.set(true));}
  accept(value:number){this.events.update(v=>[...v,'accept:'+value]);this.ltr.set(value);}
  reject(value:number){this.events.update(v=>[...v,'reject:'+value]);}
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
  for (const marker of ['ngh=', 'id="b5-ltr"', 'id="b5-rtl"', 'id="b5-vertical"', 'aria-orientation="vertical"']) assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(!html.includes('accept:') && !html.includes('reject:'), 'SSR must not emit proposals');
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
    const gate = new Promise(resolve => release = resolve);
    await page.route('**/*.js', async route => { await gate; await route.continue(); });
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'commit' });
      await page.locator('#b5-ltr').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#b5-ready').textContent(), 'false');
      await page.evaluate(() => { window.__b5Nodes = ['#b5-ltr', '#b5-rtl', '#b5-vertical'].map(s => document.querySelector(s)); });
      release();
      await page.waitForFunction(() => document.querySelector('#b5-ready')?.textContent === 'true');
      assert.deepEqual(await page.evaluate(() => window.__b5Nodes.map((node, i) => node === document.querySelector(['#b5-ltr', '#b5-rtl', '#b5-vertical'][i]))), [true, true, true]);
      const events = async () => JSON.parse(await page.locator('#b5-events').textContent());
      assert.deepEqual(await events(), []);
      assert.equal(await page.locator('#b5-ltr input').getAttribute('aria-label'), 'Reveal LTR');
      assert.equal(await page.locator('#b5-vertical input').getAttribute('aria-orientation'), 'vertical');
      const rtlRoot = await page.locator('#b5-rtl').boundingBox();
      const rtlHandle = await page.locator('#b5-rtl neu-compare-handle').boundingBox();
      assert.ok(rtlHandle.x > rtlRoot.x + rtlRoot.width / 2, 'RTL 20% handle lies toward physical right');
      const ltrRoot = await page.locator('#b5-ltr').boundingBox();
      await page.mouse.click(ltrRoot.x + ltrRoot.width * .75, ltrRoot.y + ltrRoot.height * .5);
      await page.waitForFunction(() => document.querySelector('#b5-ltr input')?.value === '80');
      assert.deepEqual(await events(), ['accept:80']);
      const rtlInput = page.locator('#b5-rtl input');
      await rtlInput.focus();
      await page.keyboard.press('ArrowRight');
      assert.deepEqual(await events(), ['accept:80', 'reject:10']);
      assert.equal(await rtlInput.inputValue(), '20');
      assert.equal(await rtlInput.evaluate(el => document.activeElement === el), true);
      assert.deepEqual(errors.filter(x => /NG050|error/i.test(x)), []);
      console.log('B5 Chromium SSR/hydration PASS: DOM reuse, 0 NG050x, controlled pointer accept, RTL keyboard reject, focus retained');
    } finally { release(); await browser.close(); }
  } finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
} finally { rmSync(fixture, { recursive: true, force: true }); }
