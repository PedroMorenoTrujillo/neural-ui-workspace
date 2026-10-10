import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformFileSync } from '@babel/core';
import linker from '@angular/compiler-cli/linker/babel';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const directory = resolve(root, 'dist/neural-ui/core/fesm2022');
const files = readdirSync(directory).filter((file) => file.endsWith('.mjs'));
if (!files.length) throw new Error('Core FESM artifacts are missing; run the production build first.');
for (const file of files) {
  transformFileSync(resolve(directory, file), {
    plugins: [[linker, { sourceMapping: false }]],
    configFile: false, babelrc: false,
  });
}
console.log(`Angular partial-linker compatibility: ${files.length}/${files.length} FESM modules.`);
