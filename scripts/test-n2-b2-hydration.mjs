import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tarballMode = process.argv.includes('--tarball');
const fixture = mkdtempSync(join(tarballMode ? tmpdir() : root, '.n2-b2-hydration-'));
const npmCache = tarballMode ? mkdtempSync(join(tmpdir(), '.n2-b2-npm-cache-')) : null;
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stdout.slice(-4000)}\n${result.stderr.slice(-4000)}`);
}

try {
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  if (tarballMode) {
    const workspacePackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const packed = spawnSync('npm', ['pack', join(root, 'dist/neural-ui/core'), '--pack-destination', fixture], {
      cwd: fixture, encoding: 'utf8', env: { ...process.env, npm_config_cache: npmCache },
    });
    if (packed.status !== 0 || packed.error) throw new Error(`Tarball pack failed: ${packed.stderr || packed.error?.message}`);
    const tarball = packed.stdout.trim().split('\n').at(-1);
    if (!tarball?.endsWith('.tgz')) throw new Error('Tarball pack did not return an archive');
    const fixturePackagePath = join(fixture, 'package.json');
    const fixturePackage = JSON.parse(readFileSync(fixturePackagePath, 'utf8'));
    const framework = workspacePackage.dependencies['@angular/core'];
    const tooling = workspacePackage.devDependencies['@angular/build'];
    fixturePackage.dependencies = {
      '@angular/cdk': workspacePackage.dependencies['@angular/cdk'],
      '@angular/common': framework,
      '@angular/compiler': framework,
      '@angular/core': framework,
      '@angular/forms': framework,
      '@angular/platform-browser': framework,
      '@angular/platform-server': framework,
      '@angular/router': framework,
      '@angular/ssr': tooling,
      '@neural-ui/core': `file:${join(fixture, tarball)}`,
      '@neural-icons/core': workspacePackage.dependencies['@neural-icons/core'],
      '@neural-icons/angular': workspacePackage.dependencies['@neural-icons/angular'],
      rxjs: workspacePackage.dependencies.rxjs,
      tslib: workspacePackage.dependencies.tslib,
    };
    fixturePackage.devDependencies = {
      '@angular/build': tooling,
      '@angular/cli': workspacePackage.devDependencies['@angular/cli'],
      '@angular/compiler-cli': workspacePackage.devDependencies['@angular/compiler-cli'],
      '@types/node': '^22.0.0',
      typescript: workspacePackage.devDependencies.typescript,
    };
    writeFileSync(fixturePackagePath, `${JSON.stringify(fixturePackage, null, 2)}\n`);
    const installed = spawnSync('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: fixture, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, npm_config_cache: npmCache },
    });
    if (installed.status !== 0 || installed.error) throw new Error(`Tarball install failed: ${installed.stderr || installed.error?.message}`);
  }
  const providers = 'provideZonelessChangeDetection(),provideClientHydration(),provideNeuralIcons(iconEdit)';
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {provideNeuralIcons} from '@neural-icons/angular';
import {iconEdit} from '@neural-icons/core/icons/edit';
import {B2Component} from './n2-b2.component';
bootstrapApplication(B2Component,{providers:[${providers}]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {provideNeuralIcons} from '@neural-icons/angular';
import {iconEdit} from '@neural-icons/core/icons/edit';
import {B2Component} from './n2-b2.component';
export default (context:BootstrapContext) => bootstrapApplication(B2Component,{providers:[${providers},provideServerRendering()]},context);
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
  writeFileSync(join(fixture, 'src/n2-b2.component.ts'), `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuMenuComponent,NeuMenuButtonComponent,NeuMenubarComponent,NeuTieredMenuComponent,NeuMenuItem} from '@neural-ui/core/menu';
@Component({selector:'app-root',imports:[NeuMenuComponent,NeuMenuButtonComponent,NeuMenubarComponent,NeuTieredMenuComponent],template:\`<main>
  <neu-menu id="b2-menu" [items]="items" (itemClick)="record('menu:'+$event.key)" />
  <neu-menu-button id="b2-button" [items]="items" label="Actions" (itemClick)="record('button:'+$event.key)" (openChange)="record('button-open:'+$event)" />
  <neu-menubar id="b2-bar" dir="rtl" [items]="items" (itemClick)="record('bar:'+$event.key)" />
  <neu-tiered-menu id="b2-tier" [items]="items" (expandedKeysChange)="record('tier-keys:'+$event.join(','))" (itemClick)="record('tier:'+$event.key)" />
  <neu-tiered-menu id="b2-controlled" [items]="items" [expandedKeys]="controlled" (expandedKeysChange)="record('controlled-keys:'+$event.join(','))" />
  <neu-tiered-menu id="b2-rtl" dir="rtl" style="display:block;width:240px;margin-left:400px" [items]="items" />
  <output id="b2-events">{{eventsJson()}}</output><output id="b2-ready">{{ready()}}</output>
</main>\`})
export class B2Component {
  readonly items:NeuMenuItem[]=[{key:'file',label:'File',icon:'edit',children:[{key:'new',label:'New',children:[{key:'text',label:'Text'}]},{key:'open',label:'Open'}]},{key:'help',label:'Help'},{key:'locked',label:'Locked',disabled:true}];
  readonly controlled=['file'];
  readonly events=signal<string[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly ready=signal(false);
  constructor(){afterNextRender(()=>this.ready.set(true));}
  record(value:string){this.events.update(events=>[...events,value]);}
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
  if (tarballMode) delete ts.compilerOptions.paths;
  else ts.compilerOptions.paths = { '@neural-ui/core': [join(root, 'dist/neural-ui/core')], '@neural-ui/core/*': [join(root, 'dist/neural-ui/core/*')] };
  writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);
  run(join(tarballMode ? fixture : root, 'node_modules/.bin/ng'), ['build'], fixture);
  run(process.execPath, [join(fixture, 'dist/server/server.mjs')], fixture);
  const browserRoot = join(fixture, 'dist/browser');
  const html = readFileSync(join(browserRoot, 'index.html'), 'utf8');
  for (const marker of ['ngh=', 'id="b2-menu"', 'id="b2-button"', 'id="b2-bar"', 'id="b2-tier"', 'id="b2-controlled"', 'id="b2-rtl"', 'role="menubar"']) assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(!html.includes('tier-keys:') && !html.includes('button-open:'), 'SSR must not emit menu events');
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
      await page.locator('#b2-tier [role="menu"]').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#b2-ready').textContent(), 'false');
      await page.evaluate(() => {
        window.__b2Nodes = ['#b2-menu','#b2-button','#b2-bar','#b2-tier','#b2-controlled','#b2-rtl'].map(s => document.querySelector(s));
        window.__b2Controls = ['#b2-button button','#b2-tier button','#b2-controlled button'].map(s => document.querySelector(s)?.getAttribute('aria-controls'));
      });
      release();
      try {
        await page.waitForFunction(() => document.querySelector('#b2-ready')?.textContent === 'true', null, { timeout: 10000 });
      } catch (error) {
        throw new Error(`Hydration readiness failed: ${JSON.stringify(errors)}; ${await page.locator('#b2-ready').textContent()}`, { cause: error });
      }
      assert.deepEqual(await page.evaluate(() => window.__b2Nodes.map((node,i) => node === document.querySelector(['#b2-menu','#b2-button','#b2-bar','#b2-tier','#b2-controlled','#b2-rtl'][i]))), [true,true,true,true,true,true]);
      assert.deepEqual(await page.evaluate(() => window.__b2Controls.map((id,i) => id === document.querySelector(['#b2-button button','#b2-tier button','#b2-controlled button'][i])?.getAttribute('aria-controls'))), [true,true,true]);
      const events = async () => JSON.parse(await page.locator('#b2-events').textContent());
      assert.deepEqual(await events(), []);
      assert.equal(await page.locator('#b2-tier button').first().getAttribute('aria-expanded'), 'false');
      const controlled = page.locator('#b2-controlled button').first();
      assert.equal(await controlled.getAttribute('aria-expanded'), 'true');
      await page.locator('#b2-button button').first().click();
      await page.locator('.neu-menu-button__panel [role="menuitem"]').first().waitFor();
      await page.waitForFunction(() => document.activeElement?.closest('.neu-menu-button__panel') !== null);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.querySelector('#b2-button button')?.getAttribute('aria-expanded') === 'false');
      assert.equal(await page.locator('#b2-button button').first().getAttribute('aria-expanded'), 'false');
      const file = page.locator('#b2-tier button').first();
      await file.hover();
      const childMenu = page.locator(`#${await file.getAttribute('aria-controls')}`);
      await childMenu.waitFor();
      const nestedBranch = childMenu.locator('[role="menuitem"]').first();
      await nestedBranch.focus();
      await page.keyboard.press('ArrowRight');
      await page.locator(`#${await nestedBranch.getAttribute('aria-controls')}`).waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await file.getAttribute('aria-expanded'), 'true');
      await page.locator('body').click({ position: { x: 1, y: 1 } });
      await page.waitForFunction(() => document.querySelector('#b2-tier button')?.getAttribute('aria-expanded') === 'false');
      assert.equal(await file.getAttribute('aria-expanded'), 'false');
      assert.equal(await controlled.getAttribute('aria-expanded'), 'true');
      await file.hover();
      await childMenu.locator('[role="menuitem"]').nth(1).click();
      await page.waitForFunction(() => document.querySelector('#b2-tier button')?.getAttribute('aria-expanded') === 'false');
      assert.equal((await events()).filter(event => event === 'tier:open').length, 1);
      await page.locator('#b2-rtl button').first().focus();
      await page.keyboard.press('ArrowLeft');
      const rtlTrigger = page.locator('#b2-rtl button').first();
      const rtlPanel = page.locator(`#${await rtlTrigger.getAttribute('aria-controls')}`);
      await rtlPanel.waitFor();
      assert.equal(await rtlPanel.getAttribute('dir'), 'rtl');
      const rtlTriggerBox = await rtlTrigger.boundingBox();
      const rtlPanelBox = await rtlPanel.boundingBox();
      assert.ok(rtlPanelBox.x + rtlPanelBox.width <= rtlTriggerBox.x + 2, 'RTL submenu opens toward physical left');
      assert.deepEqual(errors.filter(message => /NG050|error/i.test(message)), []);
      assert.ok((await events()).includes('tier-keys:file'));
      console.log(`B2 ${tarballMode ? 'tarball ' : ''}Chromium SSR/hydration PASS: DOM reuse, 0 NG050x, inline/floating menus, first hover/keyboard, controlled rejection, RTL`);
    } finally { release(); await browser.close(); }
  } finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
} finally {
  rmSync(fixture, { recursive: true, force: true });
  if (npmCache) rmSync(npmCache, { recursive: true, force: true });
}
