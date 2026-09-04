import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium, firefox, webkit } = createRequire(import.meta.url)(process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test');
const baseURL = process.env.NEU_H9_URL ?? 'http://127.0.0.1:4389';
const evidence = process.env.NEU_H9_EVIDENCE ?? '/private/tmp/h9-a2-browser-evidence';
mkdirSync(evidence, { recursive: true });
const results = [];
for (const [name, engine] of Object.entries({chromium, firefox, webkit})) {
 const browser = await engine.launch({headless:true});
 const page = await browser.newPage({ viewport: { width:1280, height:1000 }, reducedMotion:'reduce' });
 const errors = []; page.on('pageerror', error => errors.push(error.message));
 const log = async () => {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return JSON.parse(await page.locator('#h9-events').textContent());
 };
 const events = async name => (await log()).filter(event => event.name === name);
 const count = async name => (await events(name)).length;
 const reset = async () => { await page.locator('#h9-reset').click(); };
 const fresh = async () => { await page.goto(baseURL); await page.waitForFunction(() => document.querySelector('#h9-events')?.textContent?.includes('ready')); };
 const check = async (label, run) => {
  try { await run(); results.push({browser:name,case:label,status:'PASS'}); console.log(`${name}: PASS ${label}`); }
  catch(error) { results.push({browser:name,case:label,status:'FAIL',error:String(error)}); await page.screenshot({path:`${evidence}/${name}-failure.png`,fullPage:true}); throw error; }
 };
 try {
  await fresh();
  await check('B01 native and programmatic input text selection never reaches domain bindings', async () => {
   for(const id of ['h9-autocomplete','h9-tags']) {
    const input = page.locator(`#${id} input`); await input.fill('Alpha'); await input.press('Home'); await input.press('Shift+ArrowRight');
   }
   await page.locator('#h9-native-select').click();
   await page.waitForTimeout(50);
   assert.equal(await count('acSelect'),0); assert.equal(await count('tagsSelect'),0);
   assert.equal(await count('acDirect'),0); assert.equal(await count('tagsDirect'),0);
  });
  await check('B01 mouse and keyboard option activation reaches template and OutputRef exactly once', async () => {
   await fresh();
   const ac = page.locator('#h9-autocomplete input'); await ac.fill('Al'); await ac.press('ArrowDown'); await ac.press('Enter');
   assert.equal(await count('acSelect'),1); assert.equal(await count('acDirect'),1);
   assert.equal((await events('acSelect'))[0].payload.value,'a');
   await ac.fill('Be'); await page.locator('.neu-autocomplete__option').filter({hasText:'Beta'}).click();
   assert.equal(await count('acSelect'),2); assert.equal(await count('acDirect'),2);
   const tags = page.locator('#h9-tags input'); await tags.fill('Al'); await tags.press('ArrowDown'); await tags.press('Enter');
   assert.equal(await count('tagsSelect'),1); assert.equal(await count('tagsDirect'),1);
   await tags.fill('Be'); await page.locator('.neu-input-tags__option').filter({hasText:'Beta'}).click();
   assert.equal(await count('tagsSelect'),2); assert.equal(await count('tagsDirect'),2);
   assert.equal((await events('tagsSelect'))[1].payload.value,'b');
  });
  await check('Chart bar and pie publish domain points; background and legend do not', async () => {
   await fresh();
   await page.locator('#h9-chart .apexcharts-bar-area').first().waitFor();
   await page.locator('#h9-chart .apexcharts-bar-area').first().click();
   assert.equal(await count('dataSelect'),1);
   assert.equal((await events('dataSelect'))[0].payload.value,10);
   assert.equal((await events('dataSelect'))[0].payload.seriesName,'Revenue');
   await page.locator('#h9-chart').click({position:{x:3,y:3}}); assert.equal(await count('dataSelect'),1);
   const legend = page.locator('#h9-chart .apexcharts-legend-text'); if(await legend.count()) { await legend.first().click(); assert.equal(await count('dataSelect'),1); }
   const pie = page.locator('#h9-pie .apexcharts-pie-area').nth(1); await pie.scrollIntoViewIfNeeded();
   const pieBox = await pie.boundingBox(); assert.ok(pieBox);
   await page.mouse.click(pieBox.x + pieBox.width * 0.25, pieBox.y + pieBox.height * 0.5);
   assert.equal(await count('pieSelect'),1); assert.equal((await events('pieSelect'))[0].payload.value,75);
  });
  await check('Tree overlay query clear, Escape, reopen and DateInput navigation/CVA contracts', async () => {
   await fresh(); await reset();
   await page.locator('#h9-tree .neu-tree-select__trigger').click();
   assert.equal(await count('treeOpened'),1);
   const search = page.locator('.neu-tree-select__search'); await search.fill('Alpha'); await search.fill('');
   assert.deepEqual((await events('filter')).map(e=>e.payload),['Alpha','']);
   await search.press('Escape'); assert.equal(await count('treeClosed'),1);
   await page.locator('#h9-tree .neu-tree-select__trigger').click(); assert.equal(await count('treeOpened'),2);
   await page.locator('.neu-tree-select__search').press('Escape');
   await page.locator('#h9-date .neu-date-input__trigger').click();
   assert.equal(await count('dateOpened'),1);
   await page.locator('.neu-date-input__panel').getByRole('button',{name:'Next month',exact:true}).click();
   assert.equal(await count('view'),1);
   const view=(await events('view'))[0].payload; assert.ok(Date.parse(view.end)>Date.parse(view.start));
   await page.locator('#h9-date .neu-date-input__trigger').focus();
   await page.keyboard.press('Escape'); assert.equal(await count('dateClosed'),1);
   await reset(); await page.locator('#h9-write').click();
   for(const name of ['filter','treeCleared','group','dateCleared','view','number','colorEnd']) assert.equal(await count(name),0,name);
  });
  await check('VirtualList scroll publishes changing end-exclusive rendered ranges without duplicates', async () => {
   await fresh();
   const viewport=page.locator('#h9-virtual .cdk-virtual-scroll-viewport'); await viewport.scrollIntoViewIfNeeded();
   await reset(); await viewport.evaluate(element=>{element.scrollTop=1600; element.dispatchEvent(new Event('scroll'));});
   await page.waitForFunction(()=>JSON.parse(document.querySelector('#h9-events').textContent).some(e=>e.name==='range'&&e.payload.start>0));
   const ranges=(await events('range')).map(e=>e.payload); assert.ok(ranges.every(r=>r.end>r.start));
   assert.equal(new Set(ranges.map(JSON.stringify)).size,ranges.length);
  });
  await check('Dialog and BottomSheet close requests are distinct from actual panel removal', async () => {
   await fresh(); await reset();
   for(const [kind,selector] of [['dialog','.neu-dialog__panel'],['sheet','.neu-bottom-sheet']]) {
    await page.locator(`#h9-${kind}-toggle`).click(); assert.equal(await count(`${kind}Opened`),1);
    await page.locator(selector).getByRole('button',{name:kind==='dialog'?'Close dialog':'Close',exact:true}).click();
    assert.equal(await count(`${kind}Request`),1); assert.equal(await count(`${kind}Hidden`),0);
    await page.locator(`#h9-${kind}-close-owner`).click(); assert.equal(await count(`${kind}Hidden`),1);
   }
  });
  await check('Color hue keyboard and canvas pointer interactions complete once', async () => {
   await fresh(); await reset(); await page.locator('#h9-color button').first().click();
   const hue=page.locator('.neu-cp__hue-slider'); await hue.focus(); await hue.press('ArrowRight');
   assert.equal(await count('colorEnd'),1);
   const box=await page.locator('.neu-cp__canvas-wrap').boundingBox(); assert.ok(box);
   await page.mouse.move(box.x+20,box.y+20); await page.mouse.down(); await page.mouse.move(box.x+80,box.y+70,{steps:4});
   assert.equal(await count('colorEnd'),1); await page.mouse.up(); assert.equal(await count('colorEnd'),2);
  });
  await check('Destroy while controls have pending work produces no later domain/lifecycle callbacks', async () => {
   await fresh(); await page.locator('#h9-autocomplete input').fill('Al');
   await page.locator('#h9-destroy').click(); const before=await log(); await page.waitForTimeout(150);
   assert.deepEqual(await log(),before);
  });
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`${evidence}/${name}-completed.png`,fullPage:true});
 } finally { await browser.close(); writeFileSync(`${evidence}/results.json`,JSON.stringify(results,null,2)+'\n'); }
}
console.log(`PASS ${results.length} real-browser scenarios`);
