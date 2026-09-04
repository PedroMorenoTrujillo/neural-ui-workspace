import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const {chromium,firefox,webkit} = createRequire(import.meta.url)(process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test');
const results=[];
for(const [name,engine] of Object.entries({chromium,firefox,webkit})) {
 const browser=await engine.launch({headless:true}); const page=await browser.newPage(); const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 let release; const gate=new Promise(resolve=>release=resolve);
 await page.route('**/*.js',async route=>{await gate; await route.continue();});
 try {
  await page.goto(process.env.NEU_H9_HYDRATION_URL ?? 'http://127.0.0.1:4390',{waitUntil:'commit'});
  await page.locator('.neu-autocomplete__input').waitFor({state:'attached'});
  assert.equal(await page.locator('#hydration-ready').textContent(),'false');
  assert.deepEqual(JSON.parse(await page.locator('#hydration-events').textContent()),[]);
  await page.evaluate(()=>{window.__h9OriginalInput=document.querySelector('.neu-autocomplete__input');});
  release();
  await page.waitForFunction(()=>document.querySelector('#hydration-ready')?.textContent==='true');
  await page.waitForFunction(()=>document.querySelector('#hydration-events')?.textContent?.includes('opened'));
  assert.equal(await page.evaluate(()=>window.__h9OriginalInput===document.querySelector('.neu-autocomplete__input')),true,'hydration must retain the server input node');
  const log=async()=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));return JSON.parse(await page.locator('#hydration-events').textContent());};
  assert.deepEqual(await log(),['opened']);
  await page.locator('#hydration-close').click(); assert.deepEqual(await log(),['opened','hidden']);
  await page.locator('.neu-autocomplete__input').evaluate(input=>{input.value='Alpha';input.setSelectionRange(0,3);});
  assert.deepEqual(await log(),['opened','hidden']);
  const input=page.locator('.neu-autocomplete__input'); await input.fill('Al'); await input.press('ArrowDown');
  await page.locator('.neu-autocomplete__option').first().waitFor(); await input.press('Enter');
  assert.deepEqual(await log(),['opened','hidden','select']); assert.deepEqual(errors,[]);
  results.push({browser:name,status:'PASS',serverOutputs:0,domReused:true,opened:1,hidden:1,domainSelect:1});
  console.log(`${name}: PASS actual Angular 22 hydration, DOM reuse, lifecycle and B01`);
 } finally {release();await browser.close();writeFileSync(process.env.NEU_H9_HYDRATION_EVIDENCE ?? '/private/tmp/h9-a2-hydration-results.json',JSON.stringify(results,null,2)+'\n');}
}
