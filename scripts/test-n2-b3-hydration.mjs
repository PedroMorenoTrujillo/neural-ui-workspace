import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  createReadStream,
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = mkdtempSync(join(root, '.n2-b3-hydration-'));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: 30000,
  });
  if (result.status !== 0)
    throw new Error(
      `${command} failed:\n${result.stdout.slice(-4000)}\n${result.stderr.slice(-4000)}`,
    );
}

try {
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  const providers =
    'provideZonelessChangeDetection(),provideClientHydration(),provideRouter([]),provideNeuralIcons(iconEdit)';
  writeFileSync(
    join(fixture, 'src/main.ts'),
    `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {provideRouter} from '@angular/router';
import {provideNeuralIcons} from '@neural-icons/angular';
import {iconEdit} from '@neural-icons/core/icons/edit';
import {B3Component} from './n2-b3.component';
bootstrapApplication(B3Component,{providers:[${providers}]});
`,
  );
  writeFileSync(
    join(fixture, 'src/main.server.ts'),
    `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {provideRouter} from '@angular/router';
import {provideNeuralIcons} from '@neural-icons/angular';
import {iconEdit} from '@neural-icons/core/icons/edit';
import {B3Component} from './n2-b3.component';
export default (context:BootstrapContext) => bootstrapApplication(B3Component,{providers:[${providers},provideServerRendering()]},context);
`,
  );
  writeFileSync(
    join(fixture, 'src/server.ts'),
    `
import {renderApplication} from '@angular/platform-server';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import bootstrap from './main.server';
const dir=new URL('../browser/',import.meta.url),csr=new URL('index.csr.html',dir);
const document=readFileSync(existsSync(csr)?csr:new URL('index.html',dir),'utf8');
const html=await renderApplication(bootstrap,{document,url:'http://localhost/',allowedHosts:['localhost']});
if(!html.includes('ngh=')) throw new Error('Missing hydration annotations');
writeFileSync(new URL('index.html',dir),html);
`,
  );
  writeFileSync(
    join(fixture, 'src/n2-b3.component.ts'),
    `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuCarouselComponent} from '@neural-ui/core/carousel';
import {NeuSplitButtonComponent} from '@neural-ui/core/split-button';
import {NeuSpeedDialComponent} from '@neural-ui/core/speed-dial';
@Component({selector:'app-root',imports:[NeuCarouselComponent,NeuSplitButtonComponent,NeuSpeedDialComponent],template:\`<main>
  <neu-carousel id="b3-carousel" dir="rtl" [items]="slides" [page]="page()" [autoplayInterval]="60000" (pageChange)="record('page:'+$event.page)" />
  <neu-split-button id="b3-split" label="Save" [actions]="actions" (primaryClick)="record('primary')" (actionClick)="record('menu:'+$event.id)" />
  <neu-speed-dial id="b3-speed" dir="rtl" direction="left" [items]="speedItems" [open]="speedOpen()" (openChange)="record('open:'+$event)" (itemActivate)="record('speed:'+$event.item.key)" />
  <button id="b3-accept" (click)="speedOpen.set(true)">Apply open</button>
  <output id="b3-events">{{eventsJson()}}</output><output id="b3-ready">{{ready()}}</output>
</main>\`})
export class B3Component {
  readonly slides=[1,2,3];
  readonly actions=[{id:'edit',label:'Edit',icon:'edit' as const}];
  readonly speedItems=[{key:'run',label:'Run',icon:'edit' as const,badge:'2'}];
  readonly page=signal(0);
  readonly speedOpen=signal(false);
  readonly events=signal<string[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly ready=signal(false);
  constructor(){afterNextRender(()=>this.ready.set(true));}
  record(value:string){this.events.update(events=>[...events,value]);}
}
`,
  );
  const angularPath = join(fixture, 'angular.json');
  const angular = JSON.parse(readFileSync(angularPath, 'utf8'));
  Object.assign(angular.projects['compatibility-consumer'].architect.build.options, {
    server: 'src/main.server.ts',
    ssr: { entry: 'src/server.ts' },
    prerender: false,
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
  for (const marker of [
    'ngh=',
    'id="b3-carousel"',
    'id="b3-split"',
    'id="b3-speed"',
    'aria-expanded="false"',
  ])
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(!html.includes('page:1') && !html.includes('speed:run'), 'SSR must not emit actions');
  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    let file = join(browserRoot, requested === '/' ? 'index.html' : requested.slice(1));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type':
        { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ??
        'application/octet-stream',
    });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const { chromium } = createRequire(import.meta.url)(
      process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test',
    );
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await page.route('**/*.js', async (route) => {
      await gate;
      await route.continue();
    });
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'commit' });
      await page.locator('#b3-speed .neu-speed-dial__trigger').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#b3-ready').textContent(), 'false');
      await page.evaluate(() => {
        window.__b3Nodes = ['#b3-carousel', '#b3-split', '#b3-speed'].map((s) =>
          document.querySelector(s),
        );
      });
      release();
      await page.waitForFunction(
        () => document.querySelector('#b3-ready')?.textContent === 'true',
        null,
        { timeout: 10000 },
      );
      assert.deepEqual(
        await page.evaluate(() =>
          window.__b3Nodes.map(
            (node, i) =>
              node === document.querySelector(['#b3-carousel', '#b3-split', '#b3-speed'][i]),
          ),
        ),
        [true, true, true],
      );
      const events = async () => JSON.parse(await page.locator('#b3-events').textContent());
      assert.deepEqual(await events(), []);
      const next = page.locator('#b3-carousel .neu-carousel__nav').nth(1);
      await next.click();
      await page.waitForFunction(() =>
        document.querySelector('#b3-events')?.textContent?.includes('page:1'),
      );
      assert.deepEqual(await events(), ['page:1']);
      assert.equal(
        await page.locator('#b3-carousel .neu-carousel__item[aria-label="Item 1 of 3"]').count(),
        1,
      );
      await page.locator('#b3-split .neu-split-button__main').click();
      await page.waitForFunction(() =>
        document.querySelector('#b3-events')?.textContent?.includes('primary'),
      );
      assert.deepEqual(await events(), ['page:1', 'primary']);
      await page.locator('#b3-split .neu-split-button__chevron').click();
      const menu = page.locator('.neu-split-button__dropdown');
      await menu.waitFor();
      assert.equal(
        await page.locator('#b3-split .neu-split-button__chevron').getAttribute('aria-controls'),
        await menu.getAttribute('id'),
      );
      await menu.locator('button').first().click();
      await page.waitForFunction(() =>
        document.querySelector('#b3-events')?.textContent?.includes('menu:edit'),
      );
      assert.deepEqual(await events(), ['page:1', 'primary', 'menu:edit']);
      const trigger = page.locator('#b3-speed .neu-speed-dial__trigger');
      await trigger.click();
      await page.waitForFunction(() =>
        document.querySelector('#b3-events')?.textContent?.includes('open:true'),
      );
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      await page.locator('#b3-accept').click();
      await page.waitForFunction(
        () =>
          document
            .querySelector('#b3-speed .neu-speed-dial__trigger')
            ?.getAttribute('aria-expanded') === 'true',
      );
      await page.locator('#b3-speed .neu-speed-dial__action').first().click();
      await page.waitForFunction(() =>
        document.querySelector('#b3-events')?.textContent?.includes('speed:run'),
      );
      assert.equal((await events()).filter((value) => value === 'speed:run').length, 1);
      assert.deepEqual(
        errors.filter((message) => /NG050|error/i.test(message)),
        [],
      );
      console.log(
        'B3 Chromium SSR/hydration PASS: DOM reuse, 0 NG050x, no SSR autoplay, controlled Carousel/SpeedDial, primary/menu/action exactly once',
      );
    } finally {
      release();
      await browser.close();
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
