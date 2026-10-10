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
const fixture = mkdtempSync(join(root, '.n2-b6-hydration-'));
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
  writeFileSync(
    join(fixture, 'src/main.ts'),
    `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {B6Component} from './n2-b6.component';
bootstrapApplication(B6Component,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});
`,
  );
  writeFileSync(
    join(fixture, 'src/main.server.ts'),
    `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {B6Component} from './n2-b6.component';
export default (context:BootstrapContext) => bootstrapApplication(B6Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);
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
    join(fixture, 'src/n2-b6.component.ts'),
    `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuDashboardGridComponent,type NeuDashboardTileConfig} from '@neural-ui/core/dashboard-grid';
import {NeuDataViewComponent,NeuDataViewItemDirective,type NeuDataViewMode,type NeuDataViewPageEvent} from '@neural-ui/core/data-view';
@Component({selector:'app-root',imports:[NeuDashboardGridComponent,NeuDataViewComponent,NeuDataViewItemDirective],template:\`<main>
  <neu-dashboard-grid id="b6-dashboard" dir="rtl" [tiles]="tiles()" [columns]="columns()" (orderChange)="onOrder($event)">
    <div data-tile-id="a">Alpha tile content</div>
    <div data-tile-id="b">Beta tile content</div>
    <div data-tile-id="c">Gamma tile content</div>
  </neu-dashboard-grid>
  <neu-dashboard-grid id="b6-rtl-grid" dir="rtl" [tiles]="rtlTiles" [columns]="2" (orderChange)="onRtlOrder($event)" />
  <neu-data-view id="b6-data" [items]="items()" [total]="6" [currentPage]="page()" [pageSize]="2"
    [mode]="mode()" [searchFields]="searchFields" [sortOptions]="sortOptions" [trackBy]="trackItem"
    (modeChange)="onMode($event)" (pageChange)="onPage($event)" (searchChange)="record('search:'+$event)">
    <ng-template neuDataViewItem let-item>{{item.name}}</ng-template>
  </neu-data-view>
  <neu-data-view id="b6-grid-view" [items]="gridItems" mode="grid" [searchable]="false" [viewSwitcher]="false" [pagination]="false" />
  <neu-data-view id="b6-empty" [items]="[]" [searchable]="false" [viewSwitcher]="false" [pagination]="false" />
  <neu-data-view id="b6-loading" [items]="[]" [loading]="true" [searchable]="false" [viewSwitcher]="false" [pagination]="false" />
  <button id="b6-accept" type="button" (click)="accept.set(true)">Accept proposals</button>
  <button id="b6-narrow" type="button" (click)="columns.set(1)">One column</button>
  <output id="b6-events">{{eventsJson()}}</output><output id="b6-ready">{{ready()}}</output>
</main>\`})
export class B6Component {
  readonly tiles=signal<readonly NeuDashboardTileConfig[]>([{id:'a',title:'Same'},{id:'b',title:'Same'},{id:'c',title:'Third'}]);
  readonly rtlTiles:readonly NeuDashboardTileConfig[]=[{id:'r1',title:'RTL One'},{id:'r2',title:'RTL Two'}];
  readonly columns=signal(2);
  readonly items=signal<readonly {id:string;name:string}[]>([{id:'1',name:'Page 1A'},{id:'2',name:'Page 1B'}]);
  readonly gridItems=[{name:'Grid item'}];
  readonly searchFields=['name'];
  readonly sortOptions=[{label:'Name',value:'name'}];
  readonly page=signal(1);
  readonly mode=signal<NeuDataViewMode>('list');
  readonly accept=signal(false);
  readonly events=signal<string[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly ready=signal(false);
  readonly trackItem=(_index:number,item:unknown)=>(item as {id:string}).id;
  constructor(){afterNextRender(()=>this.ready.set(true));}
  record(value:string){this.events.update(events=>[...events,value]);}
  onOrder(value:readonly NeuDashboardTileConfig[]){this.record('order:'+value.map(tile=>tile.id).join(','));if(this.accept())this.tiles.set([...value]);}
  onRtlOrder(value:readonly NeuDashboardTileConfig[]){this.record('rtl:'+value.map(tile=>tile.id).join(','));}
  onMode(value:NeuDataViewMode){this.record('mode:'+value);if(this.accept())this.mode.set(value);}
  onPage(value:NeuDataViewPageEvent){this.record('page:'+value.page);if(this.accept()){this.page.set(value.page);this.items.set([{id:'3',name:'Page 2A'},{id:'4',name:'Page 2B'}]);}}
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
    'id="b6-dashboard"',
    'id="b6-data"',
    'id="b6-grid-view"',
    'id="b6-empty"',
    'id="b6-loading"',
    'Alpha tile content',
    'Page 1A',
  ])
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(!html.includes('order:b,a,c'), 'SSR emitted a proposal');
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
      await page.locator('#b6-dashboard .neu-dg__tile').first().waitFor({ state: 'attached' });
      assert.equal(await page.locator('#b6-dashboard .neu-dg__tile').count(), 3);
      assert.equal(await page.locator('#b6-data li.neu-data-view__item').count(), 2);
      assert.equal(await page.locator('#b6-grid-view ul').count(), 1);
      assert.equal(await page.locator('#b6-empty .neu-data-view__empty').count(), 1);
      assert.equal(await page.locator('#b6-loading .neu-data-view__loading').count(), 1);
      assert.equal(await page.locator('#b6-ready').textContent(), 'false');
      await page.evaluate(() => {
        window.__b6Nodes = [
          '#b6-dashboard',
          '#b6-dashboard .neu-dg__tile',
          '#b6-data',
          '#b6-data li',
        ].map((s) => document.querySelector(s));
      });
      release();
      await page.waitForFunction(() => document.querySelector('#b6-ready')?.textContent === 'true');
      assert.deepEqual(
        await page.evaluate(() =>
          window.__b6Nodes.map(
            (node, index) =>
              node ===
              document.querySelector(
                ['#b6-dashboard', '#b6-dashboard .neu-dg__tile', '#b6-data', '#b6-data li'][index],
              ),
          ),
        ),
        [true, true, true, true],
      );
      const events = async () => JSON.parse(await page.locator('#b6-events').textContent());
      const waitEvents = async (count) =>
        page.waitForFunction(
          (expected) =>
            JSON.parse(document.querySelector('#b6-events')?.textContent ?? '[]').length ===
            expected,
          count,
        );
      assert.deepEqual(await events(), []);
      const firstHandle = page.locator('#b6-dashboard .neu-dg__tile-handle').first();
      await firstHandle.focus();
      await firstHandle.press('ArrowLeft');
      await waitEvents(1);
      assert.deepEqual(await events(), ['order:b,a,c']);
      assert.equal(
        await page
          .locator('#b6-dashboard .neu-dg__tile-handle')
          .first()
          .textContent()
          .then((text) => text.includes('Same')),
        true,
      );
      assert.equal(
        await page.evaluate(
          () =>
            document.activeElement === window.__b6Nodes[1].querySelector('.neu-dg__tile-handle'),
        ),
        true,
      );
      await page.locator('#b6-data .neu-data-view__pagination button').last().click();
      await page.locator('#b6-data .neu-data-view__mode').nth(1).click();
      await page.locator('#b6-data input[type="search"]').fill('x');
      await waitEvents(4);
      assert.deepEqual(await events(), ['order:b,a,c', 'page:2', 'mode:grid', 'search:x']);
      assert.equal(
        await page
          .locator('#b6-data .neu-data-view__pagination')
          .textContent()
          .then((text) => text.includes('1 / 3')),
        true,
      );
      assert.equal(
        await page
          .locator('#b6-data')
          .getAttribute('class')
          .then((value) => value.includes('neu-data-view--list')),
        true,
      );
      assert.equal(await page.locator('#b6-data li').count(), 2);
      await page.locator('#b6-accept').click();
      await firstHandle.press('ArrowLeft');
      await page.locator('#b6-data .neu-data-view__pagination button').last().click();
      await page.locator('#b6-data .neu-data-view__mode').nth(1).click();
      await waitEvents(7);
      assert.deepEqual(await events(), [
        'order:b,a,c',
        'page:2',
        'mode:grid',
        'search:x',
        'order:b,a,c',
        'page:2',
        'mode:grid',
      ]);
      assert.equal(
        await page
          .locator('#b6-data .neu-data-view__pagination')
          .textContent()
          .then((text) => text.includes('2 / 3')),
        true,
      );
      assert.equal(
        await page
          .locator('#b6-data')
          .getAttribute('class')
          .then((value) => value.includes('neu-data-view--grid')),
        true,
      );
      assert.equal(
        await page
          .locator('#b6-data')
          .textContent()
          .then((text) => text.includes('Page 2A')),
        true,
      );
      await page.locator('#b6-narrow').click();
      await page.waitForFunction(
        () =>
          document.querySelector('#b6-dashboard')?.style.getPropertyValue('--neu-dg-cols') === '1',
      );
      assert.equal(
        await page
          .locator('#b6-dashboard')
          .evaluate((host) => host.style.getPropertyValue('--neu-dg-cols')),
        '1',
      );
      const sourceBox = await page
        .locator('#b6-dashboard .neu-dg__tile-handle')
        .nth(1)
        .boundingBox();
      const targetBox = await page.locator('#b6-dashboard .neu-dg__tile').nth(2).boundingBox();
      assert.ok(sourceBox && targetBox, 'Draggable tile geometry must exist');
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2 + 24,
        { steps: 5 },
      );
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height * 0.8,
        { steps: 20 },
      );
      await page.mouse.up();
      await page
        .waitForFunction(
          () => JSON.parse(document.querySelector('#b6-events')?.textContent ?? '[]').length > 7,
          null,
          { timeout: 5000 },
        )
        .catch(() => {});
      assert.equal(
        (await events()).length,
        8,
        `Pointer drag events: ${JSON.stringify(await events())}`,
      );
      assert.equal((await events())[7], 'order:b,c,a');
      const cancelBox = await page
        .locator('#b6-dashboard .neu-dg__tile-handle')
        .first()
        .boundingBox();
      assert.ok(cancelBox, 'Cancel fixture must have a drag handle');
      await page.mouse.move(cancelBox.x + cancelBox.width / 2, cancelBox.y + cancelBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        cancelBox.x + cancelBox.width / 2,
        cancelBox.y + cancelBox.height / 2 + 24,
        { steps: 5 },
      );
      await page.keyboard.press('Escape');
      await page.mouse.up();
      assert.equal((await events()).length, 8, 'Cancelled drag must not emit a reorder');
      await page.waitForFunction(() => document.querySelectorAll('.cdk-drag-preview').length === 0);
      const rtlSource = await page
        .locator('#b6-rtl-grid .neu-dg__tile-handle')
        .first()
        .boundingBox();
      const rtlTarget = await page.locator('#b6-rtl-grid .neu-dg__tile').nth(1).boundingBox();
      assert.ok(
        rtlSource && rtlTarget && rtlSource.x > rtlTarget.x,
        `RTL first tile must be at inline-start: ${JSON.stringify({ rtlSource, rtlTarget, direction: await page.locator('#b6-rtl-grid .neu-dg__grid').evaluate((grid) => getComputedStyle(grid).direction) })}`,
      );
      await page.mouse.move(rtlSource.x + rtlSource.width / 2, rtlSource.y + rtlSource.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        rtlSource.x + rtlSource.width / 2 - 24,
        rtlSource.y + rtlSource.height / 2,
        { steps: 5 },
      );
      const activeTarget = await page
        .locator('#b6-rtl-grid .neu-dg__tile')
        .filter({ hasText: 'RTL Two' })
        .boundingBox();
      assert.ok(activeTarget, 'RTL target must remain mounted during drag');
      await page.mouse.move(
        activeTarget.x + activeTarget.width / 2,
        activeTarget.y + activeTarget.height / 2,
        { steps: 20 },
      );
      await page.mouse.up();
      await page.waitForFunction(() => document.querySelectorAll('.cdk-drag-preview').length === 0);
      assert.equal(
        (await events()).length,
        9,
        `RTL drag must emit once: ${JSON.stringify(await events())}`,
      );
      assert.equal((await events())[8], 'rtl:r2,r1');
      assert.deepEqual(
        await page.locator('#b6-rtl-grid .neu-dg__tile-handle').allTextContents(),
        ['RTL One⠿', 'RTL Two⠿'],
        'Rejected pointer reorder must preserve applied RTL tile order',
      );
      assert.deepEqual(
        errors.filter((message) => /NG050|error/i.test(message)),
        [],
      );
      console.log(
        'B6 Chromium SSR/hydration PASS: DOM reuse, 0 NG050x, exactly-once drag and controlled keyboard/page/mode proposals, remote search and responsive layout',
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
