import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const uiCore = join(root, 'projects/ui-core');

function componentFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      files.push(...componentFiles(path));
      continue;
    }

    if (entry.endsWith('.component.ts')) {
      files.push(path);
    }
  }

  return files;
}

const requiredMethods = ['writeValue', 'registerOnChange', 'registerOnTouched', 'setDisabledState'];
const expectedSignalControls = new Map([
  ['projects/ui-core/input/neu-input.component.ts', /readonly\s+value\s*=\s*model<string>\(''\)/],
  [
    'projects/ui-core/textarea/neu-textarea.component.ts',
    /readonly\s+value\s*=\s*model<string>\(''\)/,
  ],
  [
    'projects/ui-core/password/neu-password.component.ts',
    /readonly\s+value\s*=\s*model<string>\(''\)/,
  ],
  [
    'projects/ui-core/input-mask/neu-input-mask.component.ts',
    /readonly\s+value\s*=\s*model<string>\(''\)/,
  ],
  [
    'projects/ui-core/input-otp/neu-input-otp.component.ts',
    /readonly\s+value\s*=\s*model<string>\(''\)/,
  ],
  [
    'projects/ui-core/checkbox/neu-checkbox.component.ts',
    /readonly\s+checked\s*=\s*model<boolean>\(false\)/,
  ],
  [
    'projects/ui-core/switch/neu-switch.component.ts',
    /readonly\s+checked\s*=\s*model<boolean>\(false\)/,
  ],
  [
    'projects/ui-core/radio/neu-radio-group.component.ts',
    /readonly\s+value\s*=\s*model<V\s*\|\s*null>\(null\)/,
  ],
  [
    'projects/ui-core/number-input/neu-number-input.component.ts',
    /readonly\s+value\s*=\s*model<number\s*\|\s*null>\(null\)/,
  ],
  ['projects/ui-core/knob/neu-knob.component.ts', /readonly\s+value\s*=\s*model<number>\(0\)/],
  ['projects/ui-core/date-input/neu-date-input.component.ts', /readonly\s+value\s*=\s*model<V>\(/],
]);

const violations = [];
const cvaComponents = [];
const signalComponents = [];

for (const file of componentFiles(uiCore)) {
  const source = readFileSync(file, 'utf8');
  const rel = relative(root, file);
  const templateTags = source.match(/<[a-z][^>]*>/gs) ?? [];
  for (const tag of templateTags) {
    if (/\[disabled\]\s*=\s*"[^"]*\?\s*''\s*:\s*null"/.test(tag)) {
      violations.push(
        `${relative(root, file)}: [disabled] is a boolean property; bind a boolean instead of ''/null`,
      );
    }

    const hasReactiveControl = /\[(?:formControl)\]|\bformControlName\b/.test(tag);
    const hasDisabledBinding = /\[disabled\]|\bdisabled\s*=/.test(tag);
    if (hasReactiveControl && hasDisabledBinding) {
      violations.push(
        `${relative(root, file)}: reactive form controls must receive disabled state from their FormControl`,
      );
    }
  }

  const valueSignalControl = /implements\s+[^{}]*FormValueControl\s*</.test(source);
  const checkboxSignalControl = /implements\s+[^{}]*FormCheckboxControl\b/.test(source);
  if (valueSignalControl || checkboxSignalControl) {
    signalComponents.push(rel);
    if (/\bControlValueAccessor\b|\bNG_VALUE_ACCESSOR\b/.test(source)) {
      violations.push(`${rel}: Signal Form control must not contain a CVA contract or provider`);
    }
    for (const method of requiredMethods) {
      if (new RegExp(`\\b${method}\\s*\\(`).test(source)) {
        violations.push(`${rel}: Signal Form control must not implement legacy ${method}()`);
      }
    }
    if (!/readonly\s+touch\s*=\s*output<void>\(\)/.test(source)) {
      violations.push(`${rel}: Signal Form control must expose the touch output`);
    }
    if (!/readonly\s+disabled\s*=\s*input(?:<boolean>)?\(false\)/.test(source)) {
      violations.push(`${rel}: Signal Form control must consume disabled state`);
    }
    if (!/readonly\s+readonly\s*=\s*input(?:<boolean>)?\(false\)/.test(source)) {
      violations.push(`${rel}: Signal Form control must consume readonly state`);
    }
    if (
      !/\bfocus\s*\([^)]*\)\s*:\s*void/.test(source) ||
      !/\breset\s*\([^)]*\)\s*:\s*void/.test(source)
    ) {
      violations.push(`${rel}: Signal Form control must implement focus() and reset()`);
    }
    const expectedModel = expectedSignalControls.get(rel);
    if (!expectedModel)
      violations.push(
        `${rel}: unexpected Signal Form control outside the authorized migration set`,
      );
    else if (!expectedModel.test(source))
      violations.push(`${rel}: canonical public model does not match its approved typed contract`);
    if (/readonly\s+(?:valueChange|checkedChange)\s*=\s*output/.test(source)) {
      violations.push(`${rel}: model output must not be duplicated manually`);
    }
  }

  if (!source.includes('ControlValueAccessor') && !source.includes('NG_VALUE_ACCESSOR')) {
    continue;
  }

  cvaComponents.push(rel);

  if (!source.includes('NG_VALUE_ACCESSOR')) {
    violations.push(`${rel}: missing NG_VALUE_ACCESSOR provider`);
  }

  if (!/implements\s+[^{}]*ControlValueAccessor/.test(source)) {
    violations.push(`${rel}: missing implements ControlValueAccessor`);
  }

  for (const method of requiredMethods) {
    if (!new RegExp(`\\b${method}\\s*\\(`).test(source)) {
      violations.push(`${rel}: missing ${method}()`);
    }
  }

  if (
    !/setDisabledState\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(disabled|isDisabled|_disabled|_cvaDisabled)/.test(
      source,
    )
  ) {
    violations.push(`${rel}: setDisabledState does not appear to update disabled state`);
  }
}

if (cvaComponents.length !== 13) {
  violations.push(
    `expected 13 LEGACY-CVA-YET-TO-MIGRATE components, found ${cvaComponents.length}`,
  );
}

if (signalComponents.length !== 11) {
  violations.push(`expected 11 SIGNAL-FORM-CONTROL components, found ${signalComponents.length}`);
}

for (const expected of expectedSignalControls.keys()) {
  if (!signalComponents.includes(expected))
    violations.push(`${expected}: authorized Signal Form control missing`);
}

const radioGroupSource = readFileSync(
  join(root, 'projects/ui-core/radio/neu-radio-group.component.ts'),
  'utf8',
);
if (/\bunknown\b/.test(radioGroupSource)) {
  violations.push(
    'projects/ui-core/radio/neu-radio-group.component.ts: public typed radio contract must not use unknown',
  );
}

if (violations.length) {
  console.error('ui-core CVA contract audit failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('ui-core Forms contract audit passed');
console.log(`- LEGACY-CVA-YET-TO-MIGRATE: ${cvaComponents.length}`);
console.log(`- SIGNAL-FORM-CONTROL: ${signalComponents.length}`);
for (const component of signalComponents) console.log(`  - ${component}`);
