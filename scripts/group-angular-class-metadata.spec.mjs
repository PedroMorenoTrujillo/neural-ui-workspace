import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { build } from 'esbuild';
import { groupAngularClassMetadata } from './lib/group-angular-class-metadata.mjs';

function component(name, label = name) {
  return `var ${name} = class ${name} {
    static ɵfac = i0.ɵɵngDeclareFactory({ type: ${name} });
    static ɵcmp = i0.ɵɵngDeclareComponent({ type: ${name}, template: '${label}', styles: ['.${label}{}'] });
  };
  i0.ɵɵngDeclareClassMetadata({ type: ${name}, decorators: [{ args: [{ template: '${label}' }] }] });`;
}

test('retains declarations, metadata, names and initialization order for every retained class', () => {
  const code = `${component('First')}\n${component('Second')}; globalThis.classes = [First, Second];`;
  const grouped = groupAngularClassMetadata(code, 'fixture.mjs');
  assert.deepEqual(grouped.classes, ['First', 'Second']);
  const execute = (source) => {
    const trace = [];
    const context = {
      i0: {
        ɵɵngDeclareFactory: ({ type }) => { trace.push(`factory:${type.name}`); return type; },
        ɵɵngDeclareComponent: (definition) => { trace.push(`component:${definition.type.name}`); return definition; },
        ɵɵngDeclareClassMetadata: ({ type, decorators }) => { trace.push(`metadata:${type.name}`); type.decorators = decorators; },
      },
    };
    vm.runInNewContext(source, context);
    return { trace, snapshot: JSON.stringify(context.classes.map((type) => ({
      name: type.name, template: type.ɵcmp.template, styles: type.ɵcmp.styles,
      decorators: type.decorators, factoryIsSelf: type.ɵfac === type,
    }))) };
  };
  assert.deepEqual(execute(grouped.code), execute(code));
});

test('drops unused siblings but retains the imported class and its JIT metadata', async () => {
  const code = `import * as i0 from '@angular/core';\n${component('Used', 'retained-marker')}\n${component('Unused', 'unused-marker')}\nexport { Used, Unused };`;
  const grouped = groupAngularClassMetadata(code, 'fixture.mjs');
  const bundle = await build({
    stdin: { contents: "export { Used } from 'fixture';", resolveDir: process.cwd() },
    bundle: true, write: false, format: 'esm', minify: true,
    external: ['@angular/core'],
    plugins: [{ name: 'fixture', setup(api) {
      api.onResolve({ filter: /^fixture$/ }, () => ({ path: 'fixture', namespace: 'fixture' }));
      api.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: grouped.code, loader: 'js' }));
    } }],
  });
  const output = bundle.outputFiles[0].text;
  assert.match(output, /retained-marker/);
  assert.match(output, /ngDeclareClassMetadata/);
  assert.doesNotMatch(output, /unused-marker/);
});

test('does not wrap single-class modules, custom statics, or effectful decorator expressions', () => {
  assert.equal(groupAngularClassMetadata(component('Single'), 'fixture.mjs'), null);
  const custom = component('Custom').replace('static ɵfac', 'static externalEffect = sideEffect(); static ɵfac');
  assert.equal(groupAngularClassMetadata(`${component('Normal')}\n${custom}`, 'fixture.mjs'), null);
  const decorated = component('Decorated').replace("template: 'Decorated' }]", 'template: decorate() }]');
  assert.equal(groupAngularClassMetadata(`${component('Normal')}\n${decorated}`, 'fixture.mjs'), null);
});

test('is idempotent and keeps source mappings for unchanged class bodies', () => {
  const code = `${component('First')}\n${component('Second')}`;
  const grouped = groupAngularClassMetadata(code, 'fixture.mjs');
  assert.equal(groupAngularClassMetadata(grouped.code, 'fixture.mjs'), null);
  const map = JSON.parse(grouped.map.toString());
  assert.deepEqual(map.sources, ['fixture.mjs']);
  assert.deepEqual(map.sourcesContent, [code]);
  assert.ok(map.mappings.length > 0);
});

test('does not hide effects in class construction or Angular declaration arguments', () => {
  const fixtures = [
    component('Effectful').replace('class Effectful', 'class Effectful extends createBase()'),
    component('Effectful').replace('static ɵfac', 'static { sideEffect(); } static ɵfac'),
    component('Effectful').replace('static ɵfac', '[sideEffect()]() {} static ɵfac'),
    component('Effectful').replace("template: 'Effectful', styles", 'template: createTemplate(), styles'),
  ];
  for (const fixture of fixtures) {
    assert.equal(groupAngularClassMetadata(`${component('Normal')}\n${fixture}`, 'fixture.mjs'), null);
  }
});

test('keeps Angular forwardRefs with fresh deferred callbacks eligible for sibling tree shaking', () => {
  const code = `${component('First').replace("template: 'First' }]", "template: 'First', imports: [i0.forwardRef(() => Second)] }]")}\n${component('Second')}`;
  const grouped = groupAngularClassMetadata(code, 'fixture.mjs');
  assert.deepEqual(grouped.classes, ['First', 'Second']);
  assert.match(grouped.code, /i0\.forwardRef\(\(\) => Second\)/);
});
