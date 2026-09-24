import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = mkdtempSync(join(root, '.n2-c1-hydration-'));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 90000 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stdout.slice(-4000)}\n${result.stderr.slice(-4000)}`);
}

try {
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {C1Component} from './n2-c1.component';
bootstrapApplication(C1Component,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {C1Component} from './n2-c1.component';
export default (context:BootstrapContext) => bootstrapApplication(C1Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);
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
  writeFileSync(join(fixture, 'src/n2-c1.component.ts'), `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuGalleryComponent,NeuGalleryCaptionDirective,type NeuGalleryItem} from '@neural-ui/core/gallery';
import {NeuImageViewerDirective,type NeuImageViewerItem} from '@neural-ui/core/image-viewer';
@Component({selector:'app-root',imports:[NeuGalleryComponent,NeuGalleryCaptionDirective,NeuImageViewerDirective],template:\`<main>
  <neu-gallery id="c1-controlled" dir="rtl" [items]="items()" [activeIndex]="active()"
    [showCounter]="true" thumbnailPosition="start" [circular]="false"
    (activeIndexChange)="onIndex($event)" (previewChange)="record('preview:'+$event)"
    (zoomChange)="record('zoom:'+$event)" (rotationChange)="record('rotate:'+$event)"
    (flipChange)="record('flip:'+$event.x+','+$event.y)">
    <ng-template neuGalleryCaption let-item><span class="c1-caption">{{item.caption}}</span></ng-template>
  </neu-gallery>
  <neu-gallery id="c1-uncontrolled" [items]="items()" [initialIndex]="1" [circular]="false" />
  <neu-gallery id="c1-disabled" [items]="items()" [previewEnabled]="false" />
  <neu-gallery id="c1-perf" [items]="manyItems" [circular]="true" />
  <button id="c1-standalone" type="button" [neuImageViewer]="standalone" (opened)="record('standalone:open')" (closed)="record('standalone:close')">Open independent viewer</button>
  <button id="c1-accept" type="button" (click)="accept.set(true)">Accept proposals</button>
  <output id="c1-events">{{eventsJson()}}</output><output id="c1-ready">{{ready()}}</output>
</main>\`})
export class C1Component {
  readonly items=signal<readonly NeuGalleryItem[]>([{src:'a.jpg',alt:'First image',caption:'Caption A'},{src:'b.jpg',alt:'',caption:'Caption B'},{src:'c.jpg',alt:'Third image',caption:'Caption C'}]);
  readonly standalone:NeuImageViewerItem={src:'standalone.jpg',alt:'Standalone image',caption:'Independent caption'};
  readonly manyItems:readonly NeuGalleryItem[]=Array.from({length:50},(_,index)=>({src:'perf-'+index+'.jpg',alt:'Performance image '+index}));
  readonly active=signal(0);
  readonly accept=signal(false);
  readonly events=signal<string[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly ready=signal(false);
  constructor(){afterNextRender(()=>this.ready.set(true));}
  record(value:string){this.events.update(events=>[...events,value]);}
  onIndex(value:number){this.record('index:'+value);if(this.accept())this.active.set(value);}
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
  for (const marker of ['ngh=', 'id="c1-controlled"', 'id="c1-uncontrolled"', 'id="c1-disabled"', '1 / 3', 'Caption A', 'alt="First image"', 'alt=""', 'id="c1-standalone"']) {
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  }
  assert.ok(!html.includes('neu-iv__overlay'), 'SSR opened a preview');
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
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await page.route('**/*.js', async (route) => { await gate; await route.continue(); });
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'commit' });
      await page.locator('#c1-controlled .neu-gallery__image').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#c1-controlled .neu-gallery__image').getAttribute('alt'), 'First image');
      assert.equal(await page.locator('#c1-uncontrolled .neu-gallery__image').getAttribute('alt'), '');
      assert.equal(await page.locator('#c1-disabled button.neu-gallery__preview').count(), 0);
      assert.equal(await page.locator('#c1-disabled .neu-gallery__preview--static').count(), 1);
      assert.equal(await page.locator('#c1-perf .neu-gallery__thumbnail').count(), 50);
      assert.equal(await page.evaluate(() => {
        const stage=document.querySelector('#c1-controlled .neu-gallery__stage').getBoundingClientRect();
        const thumbs=document.querySelector('#c1-controlled .neu-gallery__thumbnails').getBoundingClientRect();
        return thumbs.left > stage.left;
      }), true, 'RTL logical start strip should be physically right of the stage');
      await page.evaluate(() => { window.__c1Nodes = ['#c1-controlled', '#c1-controlled .neu-gallery__image', '#c1-controlled .neu-gallery__thumbnail'].map((selector) => document.querySelector(selector)); });
      release();
      await page.waitForFunction(() => document.querySelector('#c1-ready')?.textContent === 'true');
      assert.deepEqual(await page.evaluate(() => window.__c1Nodes.map((node,index) => node === document.querySelector(['#c1-controlled','#c1-controlled .neu-gallery__image','#c1-controlled .neu-gallery__thumbnail'][index]))), [true,true,true]);
      const events = async () => JSON.parse(await page.locator('#c1-events').textContent());
      assert.deepEqual(await events(), []);
      await page.locator('#c1-controlled .neu-gallery__thumbnail').nth(1).click();
      await page.waitForFunction(() => document.querySelector('#c1-events')?.textContent?.includes('index:1'));
      assert.deepEqual(await events(), ['index:1']);
      assert.equal(await page.locator('#c1-controlled .neu-gallery__image').getAttribute('alt'), 'First image');
      await page.locator('#c1-accept').click();
      await page.locator('#c1-controlled .neu-gallery__thumbnail').nth(1).click();
      await page.waitForFunction(() => document.querySelector('#c1-controlled .neu-gallery__image')?.getAttribute('alt') === '');
      await page.waitForFunction(() => JSON.parse(document.querySelector('#c1-events')?.textContent ?? '[]').length === 2);
      assert.deepEqual(await events(), ['index:1','index:1']);
      await page.locator('#c1-controlled .neu-gallery__preview').click();
      await page.locator('.neu-iv__img').waitFor({ state: 'attached' });
      assert.equal(await page.locator('.neu-iv').count(), 1);
      await page.waitForFunction(() => document.querySelector('.neu-iv__img')?.getAttribute('alt') === '');
      assert.equal(await page.locator('.neu-iv__img').getAttribute('alt'), '');
      assert.equal(await page.locator('.neu-iv__counter').textContent(), '2 / 3');
      assert.equal(await page.locator('.neu-iv__caption .c1-caption').textContent(), 'Caption B');
      const zoomBefore = (await events()).filter((event) => event.startsWith('zoom:')).length;
      await page.locator('.neu-iv__stage').hover();
      await page.mouse.wheel(0, -100);
      await page.waitForFunction((n) => JSON.parse(document.querySelector('#c1-events')?.textContent ?? '[]').filter((event) => event.startsWith('zoom:')).length === n + 1, zoomBefore);
      assert.match(await page.locator('.neu-iv__img').getAttribute('style'), /scale\(1\.1\)/);
      const stage = await page.locator('.neu-iv__stage').boundingBox();
      assert.ok(stage);
      await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
      await page.mouse.down();
      await page.mouse.move(stage.x + stage.width / 2 - 80, stage.y + stage.height / 2, { steps: 3 });
      await page.mouse.up();
      assert.match(await page.locator('.neu-iv__img').getAttribute('style'), /translate\(-80px/);
      assert.equal((await events()).filter((event) => event.startsWith('index:')).length, 2);
      await page.locator('.neu-iv__toolbar-actions button[aria-label="Zoom out"]').click();
      await page.locator('.neu-iv__toolbar-actions button[aria-label="Zoom out"]').click();
      await page.waitForFunction(() => document.querySelector('.neu-iv__img')?.getAttribute('style')?.includes('scale(0.6)'));
      assert.match(await page.locator('.neu-iv__img').getAttribute('style'), /scale\(0\.6\)/);
      await page.locator('.neu-iv__stage').hover();
      await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
      await page.mouse.down();
      await page.mouse.move(stage.x + stage.width / 2 - 80, stage.y + stage.height / 2, { steps: 3 });
      await page.mouse.up();
      await page.waitForFunction(() => JSON.parse(document.querySelector('#c1-events')?.textContent ?? '[]').filter((event) => event.startsWith('index:')).length === 3);
      assert.equal(await page.locator('.neu-iv__img').getAttribute('alt'), 'Third image');
      assert.match(await page.locator('.neu-iv__img').getAttribute('style'), /scale\(1\)/);
      await page.locator('.neu-iv__toolbar-actions button[aria-label="Rotate right"]').click();
      await page.locator('.neu-iv__toolbar-actions button[aria-label="Flip horizontally"]').click();
      assert.match(await page.locator('.neu-iv__img').getAttribute('style'), /rotate\(90deg\)/);
      await page.locator('.neu-iv__toolbar-actions button[aria-label="Reset image"]').click();
      await page.waitForFunction(() => document.querySelector('.neu-iv__img')?.getAttribute('style')?.includes('rotate(0deg)'));
      assert.match(await page.locator('.neu-iv__img').getAttribute('style'), /rotate\(0deg\)/);
      await page.locator('.neu-iv__toolbar-actions button[aria-label="Close preview"]').click();
      assert.equal(await page.locator('.neu-iv').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('neu-gallery__preview')), true);
      await page.locator('#c1-standalone').click();
      assert.equal(await page.locator('.neu-iv').count(), 1);
      await page.waitForFunction(() => document.querySelector('.neu-iv__img')?.getAttribute('alt') === 'Standalone image');
      assert.equal(await page.locator('.neu-iv__img').getAttribute('alt'), 'Standalone image');
      assert.equal(await page.locator('.neu-iv__caption').textContent(), 'Independent caption');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.neu-iv').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'c1-standalone');
      const perf = await page.evaluate(() => {
        const next=document.querySelector('#c1-perf .neu-gallery__nav--next');
        window.__c1PerfThumbs=Array.from(document.querySelectorAll('#c1-perf .neu-gallery__thumbnail'));
        window.__c1PerfStage=document.querySelector('#c1-perf .neu-gallery__image');
        const start=performance.now();
        for(let index=0;index<100;index++) next.click();
        return performance.now()-start;
      });
      await page.waitForFunction(() => document.querySelector('#c1-perf .neu-gallery__image')?.getAttribute('alt') === 'Performance image 0');
      assert.equal(await page.locator('#c1-perf .neu-gallery__image').count(), 1);
      assert.equal(await page.locator('#c1-perf .neu-gallery__thumbnail').count(), 50);
      assert.equal(await page.evaluate(() => window.__c1PerfStage === document.querySelector('#c1-perf .neu-gallery__image') && window.__c1PerfThumbs.every((node,index) => node === document.querySelectorAll('#c1-perf .neu-gallery__thumbnail')[index])), true);
      assert.equal(errors.filter((error) => /NG050\d|NG0\d+|TypeError|ReferenceError/.test(error)).length, 0, errors.join('\n'));
      console.log(`C1 SSR/hydration PASS: DOM reused, 0 NG050x, ${await events().then((list) => list.length)} events after interaction, one private overlay engine, zoneless. 50-item/100-next browser sample: ${perf.toFixed(1)} ms.`);
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
