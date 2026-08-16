import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { HostTree } = require('@angular-devkit/schematics');
const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');
const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const collectionPath = join(
  workspaceRoot,
  'dist',
  'neural-ui',
  'core',
  'schematics',
  'collection.json',
);
const runner = new SchematicTestRunner('@neural-ui/core', collectionPath);

const tree = new HostTree();
tree.create(
  '/angular.json',
  JSON.stringify({
    version: 1,
    projects: {
      app: {
        projectType: 'application',
        root: '',
        sourceRoot: 'src',
        architect: {
          build: {
            builder: '@angular/build:application',
            options: { browser: 'src/main.ts', styles: ['src/styles.scss'] },
          },
        },
      },
    },
  }),
);
tree.create(
  '/src/main.ts',
  "import { bootstrapApplication } from '@angular/platform-browser';\nimport { appConfig } from './app/app.config';\nimport { AppComponent } from './app/app.component';\nbootstrapApplication(AppComponent, appConfig);\n",
);
tree.create(
  '/src/app/app.config.ts',
  "import { ApplicationConfig } from '@angular/core';\nexport const appConfig: ApplicationConfig = { providers: [] };\n",
);
tree.create('/src/app/app.component.ts', 'export class AppComponent {}\n');
tree.create('/src/styles.scss', '/* consumer styles */\n');

const once = await runner.runSchematic('ng-add', { project: 'app' }, tree);
const twice = await runner.runSchematic('ng-add', { project: 'app' }, once);
const config = twice.readContent('/src/app/app.config.ts');
const angularJson = twice.readContent('/angular.json');
assert.equal(
  (config.match(/provideNeuralUI\(/g) || []).length,
  1,
  'ng add must register one provider',
);
assert.equal(
  (angularJson.match(/@neural-ui\/core\/styles/g) || []).length,
  1,
  'ng add must register one stylesheet',
);
assert.match(angularJson, /src\/styles\.scss/, 'ng add must preserve consumer styles');

const themed = await runner.runSchematic(
  'theme',
  { density: 'compact', theme: 'high-contrast' },
  twice,
);
const themedTwice = await runner.runSchematic('theme', { density: 'spacious' }, themed);
assert.match(themedTwice.readContent('/src/styles/neural-ui-theme.scss'), /compact/);
assert.match(themedTwice.readContent('/src/styles/neural-ui-theme.scss'), /high-contrast/);

let generated = themedTwice;
for (const schematic of ['layout', 'dashboard', 'crud-page']) {
  generated = await runner.runSchematic(
    schematic,
    { name: `account-${schematic}`, project: 'app' },
    generated,
  );
}
assert(generated.exists('/src/app/pages/account-layout/account-layout.component.ts'));
assert(generated.exists('/src/app/pages/account-dashboard/account-dashboard.component.scss'));
assert(generated.exists('/src/app/pages/account-crud-page/account-crud-page.component.html'));
console.log('Schematics package and idempotence checks passed');
