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
const fixture = mkdtempSync(join(root, '.n2-b10-hydration-'));
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
import {B10Component} from './n2-b10.component';
bootstrapApplication(B10Component,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});
`,
  );
  writeFileSync(
    join(fixture, 'src/main.server.ts'),
    `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {B10Component} from './n2-b10.component';
export default (context:BootstrapContext) => bootstrapApplication(B10Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);
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
    join(fixture, 'src/n2-b10.component.ts'),
    `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuCodeBlockComponent} from '@neural-ui/core/code-block';
import {NeuTerminalComponent} from '@neural-ui/core/terminal';
import {NeuTimelineComponent} from '@neural-ui/core/timeline';
import {NeuTimelineGridComponent,NeuTimelineGridRow} from '@neural-ui/core/timeline-grid';
@Component({selector:'app-root',imports:[NeuCodeBlockComponent,NeuTerminalComponent,NeuTimelineComponent,NeuTimelineGridComponent],template:\`<main>
  <neu-code-block id="b10-code" code="<b>safe</b>" language="typescript" />
  <neu-terminal id="b10-terminal" [output]="output" (commandSubmit)="record('cmd:'+$event.command)" />
  <neu-timeline id="b10-timeline" dir="rtl" [items]="timeline" ariaLabel="History" />
  <neu-timeline-grid id="b10-grid" dir="rtl" [columns]="columns" [rows]="rows" (itemClick)="record('item:'+$event.id)" (slotClick)="record('slot:'+$event.columnId)" />
  <output id="b10-events">{{eventsJson()}}</output><output id="b10-ready">{{ready()}}</output>
</main>\`})
export class B10Component {
  readonly output=[{text:'Ready'}];
  readonly timeline=[{id:'a',title:'Same',time:'Morning'},{id:'b',title:'Same',time:'Evening'}];
  readonly columns=[{id:'early',label:'Early'},{id:'late',label:'Late'}];
  readonly rows:NeuTimelineGridRow[]=[{id:'r',label:'Release',items:[{id:'done',title:'Done',start:'late'}]}];
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
    'id="b10-code"',
    'id="b10-terminal"',
    'id="b10-timeline"',
    'id="b10-grid"',
  ])
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(!html.includes('cmd:hello') && !html.includes('slot:early'), 'SSR emitted an action');
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
    await page.addInitScript(() => {
      window.__b10Copied = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (value) => window.__b10Copied.push(value) },
      });
    });
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
      await page.locator('#b10-grid .neu-timeline-grid__item').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#b10-ready').textContent(), 'false');
      await page.evaluate(() => {
        window.__b10Nodes = ['#b10-code', '#b10-terminal', '#b10-timeline', '#b10-grid'].map((s) =>
          document.querySelector(s),
        );
      });
      release();
      await page.waitForFunction(
        () => document.querySelector('#b10-ready')?.textContent === 'true',
      );
      assert.deepEqual(
        await page.evaluate(() =>
          window.__b10Nodes.map(
            (node, i) =>
              node ===
              document.querySelector(
                ['#b10-code', '#b10-terminal', '#b10-timeline', '#b10-grid'][i],
              ),
          ),
        ),
        [true, true, true, true],
      );
      const events = async () => JSON.parse(await page.locator('#b10-events').textContent());
      assert.deepEqual(await events(), []);
      assert.equal(await page.locator('#b10-code img').count(), 0);
      await page.locator('#b10-code .neu-code-block__copy').click();
      await page.waitForFunction(() =>
        document.querySelector('#b10-code [role="status"]')?.textContent?.includes('Copied'),
      );
      assert.deepEqual(await page.evaluate(() => window.__b10Copied), ['<b>safe</b>']);
      const input = page.locator('#b10-terminal input');
      await input.fill('hello');
      await input.dispatchEvent('compositionstart');
      await input.press('Enter');
      assert.deepEqual(await events(), []);
      await input.dispatchEvent('compositionend');
      await input.press('Enter');
      await page.waitForFunction(() =>
        document.querySelector('#b10-events')?.textContent?.includes('cmd:hello'),
      );
      assert.deepEqual(await events(), ['cmd:hello']);
      assert.equal(await page.locator('#b10-timeline ol > li').count(), 2);
      const rtlColumns = await page
        .locator('#b10-grid .neu-timeline-grid__column')
        .evaluateAll((columns) => columns.map((column) => column.getBoundingClientRect().x));
      assert.ok(
        rtlColumns[0] > rtlColumns[1],
        'Authored first time column must remain at RTL inline-start',
      );
      await page.locator('#b10-grid .neu-timeline-grid__slot').first().click();
      await page.locator('#b10-grid .neu-timeline-grid__item').click();
      await page.waitForFunction(() =>
        document.querySelector('#b10-events')?.textContent?.includes('item:done'),
      );
      assert.deepEqual(await events(), ['cmd:hello', 'slot:early', 'item:done']);
      assert.deepEqual(
        errors.filter((message) => /NG050|error/i.test(message)),
        [],
      );
      console.log(
        'B10 Chromium SSR/hydration PASS: DOM reuse, 0 NG050x, clipboard once, IME command once, RTL timeline/grid and event proposals',
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
