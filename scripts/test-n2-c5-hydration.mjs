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
const fixture = mkdtempSync(join(root, '.n2-c5-hydration-'));
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
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {C5Component} from './n2-c5.component';
bootstrapApplication(C5Component,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {C5Component} from './n2-c5.component';
export default (context:BootstrapContext) => bootstrapApplication(C5Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);
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
  writeFileSync(join(fixture, 'src/n2-c5.component.ts'), `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuKanbanComponent,type NeuKanbanCardMove,type NeuKanbanColumn} from '@neural-ui/core/kanban';
@Component({selector:'app-root',imports:[NeuKanbanComponent],template:\`<main>
  <button id="c5-toggle" type="button" (click)="show.set(!show())">Toggle</button>
  <button id="c5-accept" type="button" (click)="accept()">Accept</button>
  @if(show()){<neu-kanban [columns]="columns()" (cardMove)="record($event)" />}
  <output id="c5-events">{{eventsJson()}}</output><output id="c5-ready">{{ready()}}</output>
</main>\`})
export class C5Component {
  readonly show=signal(true);
  readonly ready=signal(false);
  readonly columns=signal<readonly NeuKanbanColumn[]>([
    {id:'todo',title:'To do',cards:[{id:'a',title:'Alpha'},{id:'blocked',title:'Blocked',disabled:true}]},
    {id:'done',title:'Done',cards:[]},
  ]);
  readonly events=signal<readonly NeuKanbanCardMove[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  constructor(){afterNextRender(()=>this.ready.set(true));}
  record(event:NeuKanbanCardMove){this.events.update(events=>[...events,event]);}
  accept(){
    const event=this.events().at(-1);
    if(!event)return;
    this.columns.update(columns=>{
      const sourceId=event.kind==='reorder'?event.columnId:event.fromColumnId;
      const targetId=event.kind==='reorder'?event.columnId:event.toColumnId;
      const next=columns.map(column=>({...column,cards:[...column.cards]}));
      const source=next.find(column=>column.id===sourceId)!;
      const target=next.find(column=>column.id===targetId)!;
      const [card]=source.cards.splice(event.fromIndex,1);
      target.cards.splice(event.toIndex,0,card);
      return next;
    });
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
  appTs.include = ['src/main.ts', 'src/main.server.ts', 'src/server.ts', 'src/n2-c5.component.ts'];
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
  for (const marker of ['ngh=', 'neu-kanban', 'Alpha', 'Blocked', 'c5-events'])
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.match(html, /<output id="c5-events"[^>]*>\[\]<\/output>/, 'SSR emitted a move');
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
      await page.locator('neu-kanban').waitFor({ state: 'attached' });
      await page.evaluate(() => {
        window.__c5Nodes = ['main', 'neu-kanban', '.neu-kanban__column', '[data-neu-kanban-card-id="a"]']
          .map((selector) => document.querySelector(selector));
      });
      release();
      await page.waitForFunction(() => document.querySelector('#c5-ready')?.textContent === 'true');
      assert.equal(await page.evaluate(() => window.__c5Nodes.every((node, index) =>
        node === document.querySelector(['main', 'neu-kanban', '.neu-kanban__column',
          '[data-neu-kanban-card-id="a"]'][index]))), true, 'SSR DOM not reused');
      const events = async () => JSON.parse(await page.locator('#c5-events').textContent());
      assert.deepEqual(await events(), []);
      await page.locator('[data-neu-kanban-card-id="a"]').focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#c5-events')?.textContent !== '[]');
      assert.deepEqual(await events(), [{
        kind: 'transfer', cardId: 'a', fromColumnId: 'todo', toColumnId: 'done',
        fromIndex: 0, toIndex: 0,
      }]);
      assert.equal(await page.locator('[data-neu-kanban-card-id="a"]')
        .evaluate((node) => node.closest('.neu-kanban__column')
          ?.querySelector('.neu-kanban__column-name')?.textContent), 'To do');
      await page.locator('#c5-accept').click();
      await page.waitForFunction(() => document.querySelector('[data-neu-kanban-card-id="a"]')
        ?.closest('.neu-kanban__column')?.querySelector('.neu-kanban__column-name')?.textContent === 'Done');
      assert.equal(await page.locator('[data-neu-kanban-card-id="a"]')
        .evaluate((node) => node.closest('.neu-kanban__column')
          ?.querySelector('.neu-kanban__column-name')?.textContent), 'Done');
      assert.equal((await events()).length, 1, 'Applied parent write echoed');
      assert.equal(await page.locator('[data-neu-kanban-card-id="blocked"]').getAttribute('aria-disabled'), 'true');
      const sourceBox = await page.locator('[data-neu-kanban-card-id="a"]').boundingBox();
      const targetBox = await page.locator('.neu-kanban__column').first()
        .locator('.neu-kanban__list').boundingBox();
      assert.ok(sourceBox && targetBox, 'Missing pointer geometry');
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(targetBox.x + targetBox.width / 2,
        targetBox.y + Math.min(targetBox.height - 8, 24), { steps: 16 });
      await page.mouse.up();
      await page.waitForFunction(() => {
        const value = document.querySelector('#c5-events')?.textContent;
        return value && JSON.parse(value).length === 2;
      });
      assert.equal((await events())[1].kind, 'transfer');
      assert.equal((await events())[1].fromColumnId, 'done');
      assert.equal((await events())[1].toColumnId, 'todo');
      assert.equal(await page.locator('[data-neu-kanban-card-id="a"]')
        .evaluate((node) => node.closest('.neu-kanban__column')
          ?.querySelector('.neu-kanban__column-name')?.textContent), 'Done');
      for (let index = 0; index < 100; index += 1) {
        await page.locator('#c5-toggle').click();
        await page.locator('neu-kanban').waitFor({ state: 'detached' });
        await page.locator('#c5-toggle').click();
        await page.locator('neu-kanban').waitFor({ state: 'attached' });
      }
      assert.equal(await page.locator('neu-kanban').count(), 1);
      assert.equal(errors.filter((error) => /NG050\d|NG0\d+|TypeError|ReferenceError/.test(error)).length,
        0, errors.join('\n'));
      console.log('C5 SSR/hydration PASS: DOM reused, 0 NG050x, zoneless, keyboard and real pointer proposals exactly once, applied acceptance without echo, disabled card, 100 create/destroy cycles.');
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
