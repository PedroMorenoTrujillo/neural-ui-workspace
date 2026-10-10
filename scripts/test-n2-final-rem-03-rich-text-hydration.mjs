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
const fixture = mkdtempSync(join(root, '.n2-final-rem-03-hydration-'));

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
      `${command} failed (${result.status ?? result.signal}):\n${result.stdout?.slice(-5000)}\n${result.stderr?.slice(-5000)}`,
    );
  }
}

try {
  run(process.execPath, [join(root, 'scripts/build-ui-core.mjs')]);
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {RichTextRemediationComponent} from './n2-final-rem-03.component';
bootstrapApplication(RichTextRemediationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {RichTextRemediationComponent} from './n2-final-rem-03.component';
export default (context:BootstrapContext) => bootstrapApplication(RichTextRemediationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);
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
  writeFileSync(join(fixture, 'src/n2-final-rem-03.component.ts'), `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuRichTextEditorComponent} from '@neural-ui/core/rich-text-editor';
@Component({selector:'app-root',imports:[NeuRichTextEditorComponent],template:\`<main>
  <neu-rich-text-editor [value]="value()" (valueChange)="record($event)" />
  <output id="events">{{eventsJson()}}</output>
  <output id="ready">{{ready()}}</output>
</main>\`})
export class RichTextRemediationComponent {
  readonly value=signal('<a href="https://example.test/?a=1&amp;b=2" title="A &amp; B">link</a>');
  readonly events=signal<readonly string[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly ready=signal(false);
  constructor(){afterNextRender(()=>this.ready.set(true));}
  record(html:string){this.events.update(events=>[...events,html]);this.value.set(html);}
}
`);

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
    'src/main.ts', 'src/main.server.ts', 'src/server.ts', 'src/n2-final-rem-03.component.ts',
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
  assert.ok(html.includes('ngh='), 'SSR omitted hydration annotations');
  assert.match(html, /href="https:\/\/example\.test\/\?a=1&amp;b=2"/);
  assert.match(html, /title="A &amp; B"/);
  assert.doesNotMatch(html, /&amp;amp;/);
  assert.match(html, /<output id="events"[^>]*>\[\]<\/output>/);

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
      await page.locator('.neu-rich-text-editor__surface a').waitFor({ state: 'attached' });
      await page.evaluate(() => {
        window.__richTextSsrNodes = [
          document.querySelector('main'),
          document.querySelector('neu-rich-text-editor'),
          document.querySelector('.neu-rich-text-editor__surface'),
          document.querySelector('.neu-rich-text-editor__surface a'),
        ];
      });
      const inspect = () => page.locator('.neu-rich-text-editor__surface a').evaluate((anchor) => ({
        href: anchor.href,
        title: anchor.title,
        a: new URL(anchor.href).searchParams.get('a'),
        b: new URL(anchor.href).searchParams.get('b'),
        keys: [...new URL(anchor.href).searchParams.keys()],
      }));
      const expected = {
        href: 'https://example.test/?a=1&b=2', title: 'A & B', a: '1', b: '2', keys: ['a', 'b'],
      };
      assert.deepEqual(await inspect(), expected, 'SSR link meaning changed');
      assert.deepEqual(JSON.parse(await page.locator('#events').textContent()), []);

      release();
      await page.waitForFunction(() => document.querySelector('#ready')?.textContent === 'true');
      const reused = await page.evaluate(() => window.__richTextSsrNodes.map((node, index) =>
        node === document.querySelector([
          'main', 'neu-rich-text-editor', '.neu-rich-text-editor__surface',
          '.neu-rich-text-editor__surface a',
        ][index])));
      assert.deepEqual(reused.slice(0, 3), [true, true, true], 'SSR component DOM was not reused');
      assert.deepEqual(await inspect(), expected, 'hydration changed link meaning');
      assert.deepEqual(JSON.parse(await page.locator('#events').textContent()), []);

      let canonicalAttribute = null;
      for (let cycle = 1; cycle <= 3; cycle++) {
        await page.locator('.neu-rich-text-editor__surface').evaluate((editor) => {
          editor.append(document.createTextNode('!'));
          editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
        });
        await page.waitForFunction((count) =>
          JSON.parse(document.querySelector('#events')?.textContent ?? '[]').length === count, cycle);
        assert.deepEqual(await inspect(), expected, `cycle ${cycle} changed link meaning`);
        const events = JSON.parse(await page.locator('#events').textContent());
        assert.equal(events.length, cycle, `cycle ${cycle} echoed the form value`);
        const attribute = events.at(-1).match(/href="([^"]+)"[^>]*title="([^"]+)"/);
        assert.ok(attribute, `cycle ${cycle} lost canonical attributes`);
        assert.equal(attribute[1], 'https://example.test/?a=1&amp;b=2');
        assert.equal(attribute[2], 'A &amp; B');
        if (canonicalAttribute !== null) assert.deepEqual(attribute.slice(1), canonicalAttribute);
        canonicalAttribute = attribute.slice(1);
      }
      assert.deepEqual(errors, [], errors.join('\n'));
      console.log(`RichText REM-03 Chromium SSR/hydration PASS: host/surface reused, innerHTML anchor reused=${reused[3]}, semantic URL/title, 0 NG050x, 0 initial echo, 3 stable edit cycles.`);
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
