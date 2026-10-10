import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  createReadStream,
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
const fixture = mkdtempSync(join(root, '.n2-final-rem-01-hydration-'));

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: 300_000,
    env: { ...process.env, PATH: `/opt/homebrew/bin:/usr/bin:/bin:${process.env.PATH}` },
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} failed (status=${result.status}, signal=${result.signal}, error=${result.error?.message ?? 'none'}):\n${result.stdout?.slice(-5000)}\n${result.stderr?.slice(-5000)}`,
    );
  }
}

try {
  run(process.execPath, [join(root, 'scripts/build-ui-core.mjs')]);
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  writeFileSync(
    join(fixture, 'src/main.ts'),
    `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {CalendarRemediationComponent} from './n2-final-rem-01.component';
bootstrapApplication(CalendarRemediationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});
`,
  );
  writeFileSync(
    join(fixture, 'src/main.server.ts'),
    `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {CalendarRemediationComponent} from './n2-final-rem-01.component';
export default (context:BootstrapContext) => bootstrapApplication(CalendarRemediationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);
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
    join(fixture, 'src/n2-final-rem-01.component.ts'),
    `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuCalendarComponent} from '@neural-ui/core/calendar';
function key(date:Date){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return y+'-'+m+'-'+d}
@Component({selector:'app-root',imports:[NeuCalendarComponent],template:\`<main>
  <neu-calendar [selectedDate]="selected()" (selectedDateChange)="record($event)" />
  <button id="accept" (click)="accept()">Accept</button>
  <button id="different" (click)="selected.set('2026-05-21')">Apply different</button>
  <output id="applied">{{applied()}}</output>
  <output id="proposals">{{proposalsJson()}}</output>
  <output id="ready">{{ready()}}</output>
</main>\`})
export class CalendarRemediationComponent {
  readonly selected=signal<Date|string>('2026-05-14');
  readonly pending=signal<Date|null>(null);
  readonly proposals=signal<readonly string[]>([]);
  readonly proposalsJson=computed(()=>JSON.stringify(this.proposals()));
  readonly applied=computed(()=>{const value=this.selected();return typeof value==='string'?value:key(value)});
  readonly ready=signal(false);
  constructor(){afterNextRender(()=>this.ready.set(true));}
  record(date:Date){this.pending.set(date);this.proposals.update(values=>[...values,key(date)]);}
  accept(){const value=this.pending();if(value)this.selected.set(value);}
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
  angular.cli = { ...angular.cli, cache: { enabled: false } };
  writeFileSync(angularPath, `${JSON.stringify(angular, null, 2)}\n`);
  const appTsPath = join(fixture, 'tsconfig.app.json');
  const appTs = JSON.parse(readFileSync(appTsPath, 'utf8'));
  appTs.compilerOptions.types = ['node'];
  appTs.include = [
    'src/main.ts',
    'src/main.server.ts',
    'src/server.ts',
    'src/n2-final-rem-01.component.ts',
  ];
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
  for (const marker of ['ngh=', 'neu-calendar', 'aria-pressed="true"', 'id="proposals"']) {
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  }
  assert.match(html, /<output id="proposals"[^>]*>\[\]<\/output>/);

  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    let file = join(browserRoot, requested === '/' ? 'index.html' : requested.slice(1));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const { chromium } = createRequire(import.meta.url)(process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test');
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
      await page.locator('neu-calendar').waitFor({ state: 'attached' });
      await page.evaluate(() => {
        window.__calendarSsrNodes = ['main', 'neu-calendar', '.neu-calendar__day-select[aria-pressed="true"]']
          .map((selector) => document.querySelector(selector));
      });
      release();
      await page.waitForFunction(() => document.querySelector('#ready')?.textContent === 'true');
      assert.equal(
        await page.evaluate(() => window.__calendarSsrNodes.every((node, index) =>
          node === document.querySelector(['main', 'neu-calendar', '.neu-calendar__day-select[aria-pressed="true"]'][index]))),
        true,
        'SSR calendar DOM was not reused',
      );
      const day = (label) => page.locator(`.neu-calendar__month-grid .neu-calendar__day-select[aria-label*="${label}"]`);
      const proposals = async () => JSON.parse(await page.locator('#proposals').textContent());
      const waitForProposals = async (count) =>
        page.waitForFunction((expected) => JSON.parse(document.querySelector('#proposals')?.textContent ?? '[]').length === expected, count);
      assert.deepEqual(await proposals(), [], 'hydration emitted a proposal');
      assert.equal(await day('May 14, 2026').getAttribute('aria-pressed'), 'true');

      await day('May 20, 2026').click();
      await waitForProposals(1);
      assert.deepEqual(await proposals(), ['2026-05-20']);
      assert.equal(await page.locator('#applied').textContent(), '2026-05-14');
      assert.equal(await day('May 14, 2026').getAttribute('aria-pressed'), 'true');
      assert.equal(await day('May 20, 2026').getAttribute('aria-pressed'), 'false');
      await day('May 20, 2026').click();
      await waitForProposals(2);
      assert.deepEqual(await proposals(), ['2026-05-20', '2026-05-20']);

      await page.locator('#accept').click();
      await page.waitForFunction(() => document.querySelector('#applied')?.textContent === '2026-05-20');
      assert.equal(await page.locator('#applied').textContent(), '2026-05-20');
      assert.equal(await day('May 20, 2026').getAttribute('aria-pressed'), 'true');
      assert.equal((await proposals()).length, 2, 'parent acceptance echoed a proposal');
      await page.locator('#different').click();
      await page.waitForFunction(() => document.querySelector('.neu-calendar__day-select[aria-label*="May 21, 2026"]')?.getAttribute('aria-pressed') === 'true');
      assert.equal(await day('May 21, 2026').getAttribute('aria-pressed'), 'true');
      assert.equal((await proposals()).length, 2, 'parent replacement echoed a proposal');

      await day('May 16, 2026').focus();
      await page.keyboard.press('Enter');
      await waitForProposals(3);
      assert.deepEqual(await proposals(), ['2026-05-20', '2026-05-20', '2026-05-16']);
      assert.equal(await day('May 21, 2026').getAttribute('aria-pressed'), 'true');
      await day('May 17, 2026').focus();
      await page.keyboard.press('Space');
      await waitForProposals(4);
      assert.deepEqual(await proposals(), ['2026-05-20', '2026-05-20', '2026-05-16', '2026-05-17']);
      assert.equal(await day('May 17, 2026').getAttribute('aria-pressed'), 'false');
      assert.equal(await day('May 21, 2026').getAttribute('aria-pressed'), 'true');
      assert.equal(errors.filter((error) => /NG050\d|TypeError|ReferenceError/.test(error)).length, 0, errors.join('\n'));
      console.log('Calendar remediation Chromium SSR/hydration PASS: DOM reused, 0 NG050x, 0 initial proposals, rejected and accepted pointer/keyboard proposals, exactly once.');
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
