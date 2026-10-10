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
const fixture = mkdtempSync(join(root, '.n2-b4-hydration-'));
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
import {B4Component} from './n2-b4.component';
bootstrapApplication(B4Component,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});
`,
  );
  writeFileSync(
    join(fixture, 'src/main.server.ts'),
    `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {B4Component} from './n2-b4.component';
export default (context:BootstrapContext) => bootstrapApplication(B4Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);
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
    join(fixture, 'src/n2-b4.component.ts'),
    `
import {Component,afterNextRender,computed,inject,signal} from '@angular/core';
import {NeuBlockUIComponent} from '@neural-ui/core/block-ui';
import {NeuConfirmDialogService} from '@neural-ui/core/confirm-dialog';
import {NeuConfirmPopupComponent,NeuConfirmPopupService} from '@neural-ui/core/confirm-popup';
import {NeuNotificationCenterComponent,NeuNotificationService} from '@neural-ui/core/notification-center';
@Component({selector:'app-root',imports:[NeuBlockUIComponent,NeuConfirmPopupComponent,NeuNotificationCenterComponent],template:\`<main>
  <div id="b4-block"><neu-block-ui [blocked]="blocked()" message="Loading"/><button id="b4-blocked-child">Blocked</button></div>
  <button id="b4-unblock" (click)="blocked.set(false)">Unblock</button>
  <neu-confirm-popup id="b4-popup" [open]="popupOpen()" title="Proceed?" message="Apply change?" (accepted)="record('popup:accept')" (rejected)="record('popup:reject')" />
  <neu-confirm-popup id="b4-popup-secondary" />
  <button id="b4-popup-close" (click)="popupOpen.set(false)">Apply close</button>
  <button id="b4-service-popup-open" (click)="confirmPopup()">Service popup</button>
  <button id="b4-dialog-open" (click)="confirm()">Confirm dialog</button>
  <neu-notification-center id="b4-notifications" />
  <output id="b4-events">{{eventsJson()}}</output><output id="b4-ready">{{ready()}}</output>
</main>\`})
export class B4Component {
  readonly blocked=signal(true);
  readonly popupOpen=signal(true);
  readonly events=signal<string[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly ready=signal(false);
  private readonly dialogs=inject(NeuConfirmDialogService);
  private readonly popups=inject(NeuConfirmPopupService);
  constructor(){inject(NeuNotificationService).push({message:'Saved',tone:'success',duration:0});afterNextRender(()=>this.ready.set(true));}
  record(value:string){this.events.update(events=>[...events,value]);}
  async confirm(){const value=await this.dialogs.confirm({title:'Confirm',message:'Proceed?'});this.record('dialog:'+value);}
  async confirmPopup(){const value=await this.popups.confirm({message:'Service confirmation?'});this.record('popup-service:'+value);}
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
  for (const marker of ['ngh=', 'id="b4-block"', 'id="b4-popup"', 'id="b4-notifications"'])
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(!html.includes('popup:reject') && !html.includes('dialog:true'), 'SSR output');
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
      await page.locator('#b4-popup [role="alertdialog"]').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#b4-ready').textContent(), 'false');
      await page.evaluate(() => {
        window.__b4Nodes = ['#b4-block', '#b4-popup', '#b4-notifications'].map((s) =>
          document.querySelector(s),
        );
      });
      release();
      await page.waitForFunction(() => document.querySelector('#b4-ready')?.textContent === 'true');
      assert.deepEqual(
        await page.evaluate(() =>
          window.__b4Nodes.map(
            (node, i) =>
              node === document.querySelector(['#b4-block', '#b4-popup', '#b4-notifications'][i]),
          ),
        ),
        [true, true, true],
      );
      const events = async () => JSON.parse(await page.locator('#b4-events').textContent());
      assert.deepEqual(await events(), []);
      assert.equal(await page.locator('#b4-blocked-child').getAttribute('inert'), '');
      await page.evaluate(() =>
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })),
      );
      await page.waitForFunction(() =>
        document.querySelector('#b4-events')?.textContent?.includes('popup:reject'),
      );
      assert.deepEqual(await events(), ['popup:reject']);
      assert.equal(await page.locator('#b4-popup [role="alertdialog"]').count(), 1);
      await page.locator('#b4-popup-close').evaluate((button) => button.click());
      await page.locator('#b4-popup [role="alertdialog"]').waitFor({ state: 'detached' });
      await page.locator('#b4-unblock').evaluate((button) => button.click());
      assert.equal(await page.locator('#b4-blocked-child').getAttribute('inert'), null);
      await page.locator('#b4-service-popup-open').click();
      await page.locator('#b4-popup .neu-confirm-popup').waitFor();
      assert.equal(await page.locator('.neu-confirm-popup').count(), 1);
      assert.equal(await page.locator('#b4-popup-secondary .neu-confirm-popup').count(), 0);
      await page.locator('#b4-popup .neu-confirm-popup__accept').click();
      await page.waitForFunction(() =>
        document.querySelector('#b4-events')?.textContent?.includes('popup-service:true'),
      );
      assert.equal((await events()).filter((value) => value === 'popup-service:true').length, 1);
      await page.locator('#b4-dialog-open').click();
      const dialog = page.locator('.neu-confirm-dialog');
      await dialog.waitFor();
      await dialog.locator('.neu-confirm-dialog__btn--primary').click();
      await page.waitForFunction(() =>
        document.querySelector('#b4-events')?.textContent?.includes('dialog:true'),
      );
      assert.equal((await events()).filter((value) => value === 'dialog:true').length, 1);
      await page.locator('#b4-notifications .neu-nc__bell').click();
      await page.locator('.neu-nc__panel').waitFor();
      await page.locator('.cdk-overlay-backdrop').click({ position: { x: 2, y: 2 } });
      await page.waitForFunction(
        () =>
          document
            .querySelector('#b4-notifications .neu-nc__bell')
            ?.getAttribute('aria-expanded') === 'false',
      );
      assert.deepEqual(
        errors.filter((message) => /NG050|error/i.test(message)),
        [],
      );
      console.log(
        'B4 Chromium SSR/hydration PASS: DOM reuse, 0 NG050x, controlled rejection, BlockUI, CDK confirm and notification lifecycle',
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
