import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = mkdtempSync(join(tmpdir(), 'n2-icons-hydration-'));
const npmCache = mkdtempSync(join(tmpdir(), 'n2-icons-npm-cache-'));
const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, {
    cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, npm_config_cache: npmCache },
  });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stdout.slice(-3500)}\n${result.stderr.slice(-3500)}`);
  return result.stdout;
};

try {
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  const workspacePackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const tarball = run('npm', ['pack', join(root, 'dist/neural-ui/core'), '--pack-destination', fixture])
    .trim().split('\n').at(-1);
  const packagePath = join(fixture, 'package.json');
  const consumerPackage = JSON.parse(readFileSync(packagePath, 'utf8'));
  consumerPackage.dependencies = {
    '@angular/cdk': workspacePackage.dependencies['@angular/cdk'],
    ...Object.fromEntries([
      '@angular/common', '@angular/compiler', '@angular/core', '@angular/forms',
      '@angular/platform-browser', '@angular/platform-server', '@angular/router', '@angular/ssr',
    ].map(name => [name, workspacePackage.dependencies[name] ?? workspacePackage.devDependencies[name]])),
    '@neural-icons/angular': '0.0.1-next.1', '@neural-icons/core': '0.0.1-next.0',
    '@neural-ui/core': `file:${join(fixture, tarball)}`,
    rxjs: workspacePackage.dependencies.rxjs, tslib: workspacePackage.dependencies.tslib,
  };
  consumerPackage.devDependencies = {
    '@angular/build': workspacePackage.devDependencies['@angular/build'],
    '@angular/cli': workspacePackage.devDependencies['@angular/cli'],
    '@angular/compiler-cli': workspacePackage.devDependencies['@angular/compiler-cli'],
    '@types/node': '22.19.0', typescript: workspacePackage.devDependencies.typescript,
  };
  writeFileSync(packagePath, `${JSON.stringify(consumerPackage, null, 2)}\n`);
  run('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts'], fixture);
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {NeuralIcon} from '@neural-icons/angular';
import {provideNeuIconResolver} from '@neural-ui/core/foundation';
import {iconSave} from '@neural-icons/core/icons/save';
import {iconDownload} from '@neural-icons/core/icons/download';
import {IconsApp} from './n2-icons.component';
const icons:Record<string,typeof iconSave|typeof iconDownload>={save:iconSave,download:iconDownload};
bootstrapApplication(IconsApp,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideNeuIconResolver(({key,size,strokeWidth})=>icons[key]?{component:NeuralIcon,inputs:{icon:icons[key],size,strokeWidth}}:null)]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {NeuralIcon} from '@neural-icons/angular';
import {provideNeuIconResolver} from '@neural-ui/core/foundation';
import {iconSave} from '@neural-icons/core/icons/save';
import {iconDownload} from '@neural-icons/core/icons/download';
import {IconsApp} from './n2-icons.component';
const icons:Record<string,typeof iconSave|typeof iconDownload>={save:iconSave,download:iconDownload};
export default (context:BootstrapContext) => bootstrapApplication(IconsApp,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering(),provideNeuIconResolver(({key,size,strokeWidth})=>icons[key]?{component:NeuralIcon,inputs:{icon:icons[key],size,strokeWidth}}:null)]},context);
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
  writeFileSync(join(fixture, 'src/n2-icons.component.ts'), `
import {Component,afterNextRender,signal} from '@angular/core';
import type {NeuralIconName} from '@neural-icons/core';
import {NeuButtonComponent} from '@neural-ui/core/button';
import {NeuAlertComponent} from '@neural-ui/core/alert';
@Component({selector:'app-root',imports:[NeuButtonComponent,NeuAlertComponent],template:\`<main>
  <neu-alert id="a0-alert" tone="success">Ready</neu-alert>
  <button neu-button id="a0-save" icon="save" (neuClick)="increment()">Save</button>
  <button neu-button id="a0-end" icon="download" iconPosition="end">Download</button>
  <button neu-button id="a0-only" icon="save" [iconOnly]="true" ariaLabel="Save item"></button>
  <button neu-button id="a0-dynamic" [icon]="dynamic()">Dynamic</button>
  <button id="a0-switch" type="button" (click)="dynamic.set('download')">Switch</button>
  <button neu-button id="a0-missing" icon="trash" [iconOnly]="true" ariaLabel="Missing icon"></button>
  <output id="a0-events">{{events()}}</output><output id="a0-ready">{{ready()}}</output>
</main>\`})
export class IconsApp {
  readonly dynamic=signal<NeuralIconName>('save');
  readonly events=signal(0);
  readonly ready=signal(false);
  constructor(){afterNextRender(()=>this.ready.set(true));}
  increment(){this.events.update(value=>value+1);}
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
  run(join(fixture, 'node_modules/.bin/ng'), ['build'], fixture);
  run(process.execPath, [join(fixture, 'dist/server/server.mjs')], fixture);
  const browserRoot = join(fixture, 'dist/browser');
  const html = readFileSync(join(browserRoot, 'index.html'), 'utf8');
  for (const marker of ['ngh=', 'id="a0-save"', 'id="a0-end"', 'id="a0-only"', 'id="a0-dynamic"']) {
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  }
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
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const { chromium } = createRequire(import.meta.url)(process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test');
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      let release;
      const gate = new Promise((resolve) => { release = resolve; });
      await page.route('**/*.js', async (route) => { await gate; await route.continue(); });
      try {
        await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'commit' });
        await page.locator('#a0-save').waitFor({ state: 'attached' });
        assert.equal(await page.locator('#a0-ready').textContent(), 'false');
        await page.locator('#a0-save').focus();
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'a0-save');
        await page.evaluate(() => {
          window.__a0Nodes = ['#a0-save', '#a0-end', '#a0-only', '#a0-dynamic']
            .map((selector) => document.querySelector(selector));
          window.__a0Svgs = document.querySelectorAll('neural-icon svg').length;
        });
        release();
        await page.waitForFunction(() => document.querySelector('#a0-ready')?.textContent === 'true');
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'a0-save',
          'hydration must preserve focus on the existing button');
        assert.deepEqual(await page.evaluate(() => window.__a0Nodes.map((node, index) =>
          node === document.querySelector(['#a0-save', '#a0-end', '#a0-only', '#a0-dynamic'][index]))),
        [true, true, true, true]);
        assert.equal(await page.evaluate(() => window.__a0Svgs),
          await page.locator('neural-icon svg').count(), 'hydration must not duplicate SVGs');
        assert.equal(await page.locator('#a0-events').textContent(), '0');
        assert.equal(await page.locator('#a0-missing neural-icon svg').count(), 0);
        assert.equal(await page.locator('#a0-only').getAttribute('aria-label'), 'Save item');
        await page.locator('#a0-save').click();
        await page.waitForFunction(() => document.querySelector('#a0-events')?.textContent === '1');
        assert.equal(await page.locator('#a0-events').textContent(), '1');
        await page.locator('#a0-dynamic').focus();
        await page.locator('#a0-switch').click();
        await page.waitForFunction(() => document.querySelector('#a0-dynamic neural-icon')?.getAttribute('data-neural-icon') === 'download');
        assert.deepEqual(errors.filter((value) => /NG050|error/i.test(value)), []);
        console.log('A0.2 Chromium zoneless hydration PASS: DOM reuse, 0 NG050x, no SVG duplication, first action once, dynamic update.');
      } finally { release(); }
    } finally { await browser.close(); }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
  rmSync(npmCache, { recursive: true, force: true });
}
