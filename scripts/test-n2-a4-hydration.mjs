import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = mkdtempSync(join(root, '.n2-a4-hydration-'));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stdout.slice(-3500)}\n${result.stderr.slice(-3500)}`);
}

try {
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {A4Component} from './n2-a4.component';
bootstrapApplication(A4Component,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {A4Component} from './n2-a4.component';
export default (context:BootstrapContext) => bootstrapApplication(A4Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);
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
  writeFileSync(join(fixture, 'src/n2-a4.component.ts'), `
import {Component,afterNextRender,signal} from '@angular/core';
import {NeuMeterGroupComponent} from '@neural-ui/core/meter-group';
import {NeuProgressBarComponent} from '@neural-ui/core/progress-bar';
import {NeuStatsCardComponent} from '@neural-ui/core/stats-card';
import {NeuFormFieldComponent,NeuInputGroupComponent} from '@neural-ui/core/form-field';
import {NeuInputComponent} from '@neural-ui/core/input';
import {NeuNumberInputComponent} from '@neural-ui/core/number-input';
@Component({selector:'app-root',imports:[NeuMeterGroupComponent,NeuProgressBarComponent,NeuStatsCardComponent,NeuFormFieldComponent,NeuInputGroupComponent,NeuInputComponent,NeuNumberInputComponent],template:\`<main>
  <neu-meter-group id="a4-meter" ariaLabel="Capacity" [items]="items" [total]="100" />
  <neu-progress-bar id="a4-progress" label="Upload" [value]="65" />
  <neu-progress-bar id="a4-indeterminate" [indeterminate]="true" />
  <neu-stats-card id="a4-stats" title="Revenue" value="$200" change="+2%"><span data-visual>Consumer visual</span></neu-stats-card>
  <neu-form-field id="a4-name" label="Name" forId="a4-name-control" hint="Full name">
    <neu-input inputId="a4-name-control" [floatingLabel]="false" [value]="name()" (valueChange)="values.update(v=>v+1)" />
  </neu-form-field>
  <neu-form-field #field="neuFormField" id="amount-field" label="Amount" forId="a4-amount-control" hint="Positive only" [error]="error()">
    <neu-input-group id="a4-group"><span>$</span><neu-number-input inputId="a4-amount-control" [value]="amount()" [invalid]="!!error()" [ariaDescribedBy]="field.describedBy()" (valueChange)="values.update(v=>v+1)" /><button type="button" (click)="actions.update(v=>v+1)">Apply</button></neu-input-group>
  </neu-form-field>
  <output id="a4-actions">{{actions()}}</output><output id="a4-values">{{values()}}</output><output id="a4-ready">{{ready()}}</output>
</main>\`})
export class A4Component {
  readonly items=[{label:'Used',value:60},{label:'Free',value:40}];
  readonly name=signal('Ada');readonly amount=signal(3);readonly error=signal('Invalid amount');
  readonly actions=signal(0);readonly values=signal(0);readonly ready=signal(false);
  constructor(){afterNextRender(()=>this.ready.set(true));}
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
  for (const marker of ['ngh=', 'id="a4-meter"', 'id="a4-progress"', 'id="a4-indeterminate"', 'id="a4-stats"', 'id="a4-name"', 'id="a4-group"']) assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(html.includes('aria-valuenow="65"'));
  assert.ok(html.includes('amount-field-hint amount-field-error'));
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
      await page.locator('#a4-meter').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#a4-ready').textContent(), 'false');
      await page.evaluate(() => { window.__a4Nodes = ['#a4-meter','#a4-progress','#a4-indeterminate','#a4-stats','#a4-name','#a4-group','#a4-name-control','#a4-amount-control'].map(s => document.querySelector(s)); });
      release();
      await page.waitForFunction(() => document.querySelector('#a4-ready')?.textContent === 'true');
      assert.deepEqual(await page.evaluate(() => window.__a4Nodes.map((node, i) => node === document.querySelector(['#a4-meter','#a4-progress','#a4-indeterminate','#a4-stats','#a4-name','#a4-group','#a4-name-control','#a4-amount-control'][i]))), [true,true,true,true,true,true,true,true]);
      assert.equal(await page.locator('#a4-progress [role="progressbar"]').getAttribute('aria-valuenow'), '65');
      assert.equal(await page.locator('#a4-indeterminate [role="progressbar"]').getAttribute('aria-valuenow'), null);
      assert.equal(await page.locator('#a4-amount-control').getAttribute('aria-describedby'), 'amount-field-hint amount-field-error');
      assert.equal(await page.locator('#a4-stats polyline').count(), 0);
      assert.equal(await page.locator('#a4-actions').textContent(), '0');
      assert.equal(await page.locator('#a4-values').textContent(), '0');
      await page.locator('#a4-group > button').click();
      await page.waitForFunction(() => document.querySelector('#a4-actions')?.textContent === '1');
      assert.deepEqual(errors.filter(x => /NG050|error/i.test(x)), []);
      console.log('A4 Chromium SSR/hydration PASS: six surfaces, DOM/ID reuse, first action once, 0 NG050x');
    } finally { release(); await browser.close(); }
  } finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
} finally { rmSync(fixture, { recursive: true, force: true }); }
