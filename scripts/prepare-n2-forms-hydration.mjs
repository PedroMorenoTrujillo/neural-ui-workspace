import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dependencies = resolve(process.env.NEU_N2_DEPENDENCIES ?? join(root, 'node_modules'));
if (!existsSync(join(dependencies, '@angular/ssr/package.json'))) {
  throw new Error('N2 hydration requires Angular SSR dependencies. Set NEU_N2_DEPENDENCIES.');
}
const fixture = mkdtempSync(join(dirname(dependencies), '.n2-forms-hydration-'));
cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
writeFileSync(
  join(fixture, 'src/main.ts'),
  `import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {provideNeuralUI} from '@neural-ui/core';
import {N2FormsHydrationComponent} from './n2-forms-hydration.component';
bootstrapApplication(N2FormsHydrationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideNeuralUI()]});\n`,
);
writeFileSync(
  join(fixture, 'src/main.server.ts'),
  `import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {provideNeuralUI} from '@neural-ui/core';
import {N2FormsHydrationComponent} from './n2-forms-hydration.component';
export default (context:BootstrapContext) => bootstrapApplication(N2FormsHydrationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering(),provideNeuralUI()]},context);\n`,
);
writeFileSync(
  join(fixture, 'src/server.ts'),
  `import {renderApplication} from '@angular/platform-server';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import bootstrap from './main.server';
const dir=new URL('../browser/',import.meta.url),csr=new URL('index.csr.html',dir);
const document=readFileSync(existsSync(csr)?csr:new URL('index.html',dir),'utf8');
const html=await renderApplication(bootstrap,{document,url:'http://localhost/',allowedHosts:['localhost']});
if(!html.includes('ngh=')) throw new Error('Missing hydration annotations');
writeFileSync(new URL('index.html',dir),html);
console.log('N2 Forms SSR page prepared for browser hydration');\n`,
);
const configPath = join(fixture, 'angular.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
Object.assign(config.projects['compatibility-consumer'].architect.build.options, {
  server: 'src/main.server.ts',
  ssr: { entry: 'src/server.ts' },
  prerender: false,
});
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
const tsPath = join(fixture, 'tsconfig.app.json');
const ts = JSON.parse(readFileSync(tsPath, 'utf8'));
ts.compilerOptions.types = ['node'];
writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);
console.log(fixture);
