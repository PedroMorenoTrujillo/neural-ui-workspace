import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const zones = ['UTC', 'Europe/Madrid', 'America/New_York'];
const dateInputModule = new URL(
  '../dist/neural-ui/core/fesm2022/neural-ui-core-date-input.mjs',
  import.meta.url,
).href;
const program = `
  import '@angular/compiler';
  import { civilDate, localDateTime } from ${JSON.stringify(dateInputModule)};
  console.log(JSON.stringify({
    spring: civilDate('2026-03-29'),
    autumn: civilDate('2026-10-25'),
    localGap: localDateTime('2026-03-29T02:30'),
  }));
`;

for (const zone of zones) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', program], {
    encoding: 'utf8',
    env: { ...process.env, TZ: zone },
  });
  assert.equal(result.status, 0, `${zone}: ${result.stderr}`);
  assert.deepEqual(JSON.parse(result.stdout), {
    spring: '2026-03-29',
    autumn: '2026-10-25',
    localGap: '2026-03-29T02:30',
  });
}

console.log(`N2-006 civil date/timezone invariance passed: ${zones.join(', ')}`);
