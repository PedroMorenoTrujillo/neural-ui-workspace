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
const fixture = mkdtempSync(join(root, '.n2-b1-hydration-'));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
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
import {B1Component} from './n2-b1.component';
bootstrapApplication(B1Component,{providers:[${providers}]});
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
import {B1Component} from './n2-b1.component';
export default (context:BootstrapContext) => bootstrapApplication(B1Component,{providers:[${providers},provideServerRendering()]},context);
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
    join(fixture, 'src/n2-b1.component.ts'),
    `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuBreadcrumbComponent} from '@neural-ui/core/breadcrumb';
import {NeuDockComponent} from '@neural-ui/core/dock';
import {NeuNavComponent} from '@neural-ui/core/nav';
import {NeuStepperComponent} from '@neural-ui/core/stepper';
@Component({selector:'app-root',imports:[NeuBreadcrumbComponent,NeuDockComponent,NeuNavComponent,NeuStepperComponent],template:\`<main>
  <neu-breadcrumb id="b1-crumb" [items]="crumbs" />
  <neu-dock id="b1-dock" direction="rtl" [items]="dock" />
  <neu-nav id="b1-nav" dir="rtl" [items]="nav" [collapsed]="collapsed()" (collapsedChange)="record('collapse:'+$event)" />
  <button id="b1-accept" (click)="collapsed.set(true)">Apply collapse</button>
  <neu-stepper id="b1-step" [steps]="steps" [activeStep]="step()" (stepChange)="record('step:'+$event)" />
  <output id="b1-events">{{eventsJson()}}</output><output id="b1-ready">{{ready()}}</output>
</main>\`})
export class B1Component {
  readonly crumbs=[{label:'Home',route:'/',icon:'edit' as const},{label:'Current'}];
  readonly dock=[{key:'home',label:'Home',active:true,badge:'1'},{key:'docs',label:'Docs',routerLink:'/docs'}];
  readonly nav=[{id:'home',label:'Home',icon:'edit' as const,route:'/',active:true},{id:'group',label:'Group',icon:'edit' as const,children:[{id:'docs',label:'Docs',icon:'edit' as const,route:'/docs',badge:'New'}]}];
  readonly steps=[{label:'One'},{label:'Two'}];
  readonly collapsed=signal(false);
  readonly step=signal(0);
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
    'id="b1-crumb"',
    'id="b1-dock"',
    'id="b1-nav"',
    'id="b1-step"',
    'aria-current="page"',
  ])
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.ok(
    !html.includes('collapse:true') && !html.includes('step:1'),
    'SSR must not emit proposals',
  );
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
      await page.locator('#b1-nav nav').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#b1-ready').textContent(), 'false');
      await page.evaluate(() => {
        window.__b1Nodes = ['#b1-crumb', '#b1-dock', '#b1-nav', '#b1-step'].map((s) =>
          document.querySelector(s),
        );
        window.__b1SvgCount = document.querySelectorAll(
          '#b1-crumb svg, #b1-dock svg, #b1-nav svg',
        ).length;
      });
      release();
      await page.waitForFunction(
        () => document.querySelector('#b1-ready')?.textContent === 'true',
        null,
        { timeout: 10000 },
      );
      assert.deepEqual(
        await page.evaluate(() =>
          window.__b1Nodes.map(
            (node, i) =>
              node === document.querySelector(['#b1-crumb', '#b1-dock', '#b1-nav', '#b1-step'][i]),
          ),
        ),
        [true, true, true, true],
      );
      const events = async () => JSON.parse(await page.locator('#b1-events').textContent());
      assert.deepEqual(await events(), []);
      assert.equal(await page.locator('#b1-nav a[aria-current="page"]').count(), 1);
      assert.equal(
        await page.evaluate(
          () =>
            document.querySelectorAll('#b1-crumb svg, #b1-dock svg, #b1-nav svg').length ===
            window.__b1SvgCount,
        ),
        true,
      );
      await page.locator('#b1-nav .neu-nav__item--parent').first().click();
      await page.locator('#b1-nav a[href="/docs"]').waitFor();
      assert.equal(await page.locator('#b1-nav [role="menu"]').count(), 0);
      const toggle = page.locator('#b1-nav .neu-nav__toggle-tab');
      await toggle.click();
      await page.waitForFunction(() =>
        document.querySelector('#b1-events')?.textContent?.includes('collapse:true'),
      );
      assert.deepEqual(await events(), ['collapse:true']);
      assert.equal(await page.locator('#b1-nav .neu-nav-wrapper--collapsed').count(), 0);
      assert.equal(await toggle.evaluate((node) => node === document.activeElement), true);
      await page.locator('#b1-accept').click();
      await page.locator('#b1-nav .neu-nav-wrapper--collapsed').waitFor();
      assert.equal(await page.locator('#b1-nav .neu-nav-wrapper--collapsed').count(), 1);
      assert.deepEqual(await events(), ['collapse:true']);
      await page.locator('#b1-step .neu-stepper__step-btn').nth(1).click();
      await page.waitForFunction(() =>
        document.querySelector('#b1-events')?.textContent?.includes('step:1'),
      );
      assert.deepEqual(await events(), ['collapse:true', 'step:1']);
      assert.equal(
        await page.locator('#b1-step .neu-stepper__step-btn[aria-current="step"]').count(),
        1,
      );
      assert.deepEqual(
        errors.filter((message) => /NG050|error/i.test(message)),
        [],
      );
      console.log(
        'B1 Chromium SSR/hydration PASS: DOM reuse, 0 NG050x, zoneless, controlled rejection, exactly-once proposals',
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
