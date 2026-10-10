import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const uiCore = join(root, 'projects/ui-core');
const failures = [];

const aliases = new Map([
  ['foundation/neu-visual.ts:NeuTone', ['neutral', 'brand', 'info', 'success', 'warning', 'danger']],
  ['foundation/neu-visual.ts:NeuVariant', ['solid', 'soft', 'outline', 'ghost', 'text']],
  ['foundation/neu-visual.ts:NeuDensity', ['compact', 'normal', 'relaxed']],
  ['alert/neu-alert.component.ts:NeuAlertTone', ['info', 'success', 'warning', 'danger']],
  ['alert/neu-alert.component.ts:NeuAlertVariant', ['soft', 'outline']],
  ['autocomplete/neu-autocomplete.types.ts:NeuAutocompleteVariant', ['outline', 'solid']],
  ['badge/neu-badge.component.ts:NeuBadgeTone', ['neutral', 'success', 'info', 'warning', 'danger']],
  ['badge/neu-badge.component.ts:NeuBadgeVariant', ['soft', 'outline']],
  ['button/neu-button.component.ts:NeuButtonTone', ['neutral', 'brand', 'danger']],
  ['button/neu-button.component.ts:NeuButtonVariant', ['solid', 'outline', 'ghost']],
  ['calendar/neu-calendar.component.ts:NeuCalendarEventTone', ['brand', 'success', 'warning', 'danger', 'info']],
  ['chip/neu-chip.component.ts:NeuChipTone', ['neutral', 'brand', 'success', 'warning', 'danger']],
  ['notification-center/neu-notification-center.component.ts:NeuNotificationTone', ['info', 'success', 'warning', 'danger']],
  ['progress-bar/neu-progress-bar.component.ts:NeuProgressTone', ['brand', 'success', 'warning', 'danger']],
  ['select/neu-select.types.ts:NeuSelectVariant', ['outline', 'solid']],
  ['spinner/neu-spinner.component.ts:NeuSpinnerTone', ['brand', 'success', 'warning', 'danger', 'info']],
  ['tag/neu-tag.component.ts:NeuTagTone', ['neutral', 'success', 'info', 'warning', 'danger']],
  ['tag/neu-tag.component.ts:NeuTagVariant', ['soft', 'solid']],
  ['timeline/neu-timeline.component.ts:NeuTimelineItemTone', ['neutral', 'success', 'warning', 'danger', 'info']],
  ['timeline-grid/neu-timeline-grid.component.ts:NeuTimelineGridItemTone', ['neutral', 'success', 'warning', 'danger', 'info']],
  ['toast/neu-toast.types.ts:NeuToastTone', ['success', 'danger', 'info', 'warning']],
  ['toolbar/neu-toolbar.component.ts:NeuToolbarTone', ['neutral', 'brand']],
  ['toolbar/neu-toolbar.component.ts:NeuToolbarVariant', ['solid', 'soft', 'ghost']],
]);

const forbiddenMembers = new Map([
  ['alert/neu-alert.component.ts', ['type', 'outline']],
  ['badge/neu-badge.component.ts', ['outline', 'severity']],
  ['calendar/neu-calendar.component.ts', ['variant']],
  ['chip/neu-chip.component.ts', ['variant']],
  ['code-block/neu-code-block.component.ts', ['compact']],
  ['context-menu/neu-context-menu.component.ts', ['variant']],
  ['empty-state/neu-empty-state.component.ts', ['compact']],
  ['nav/neu-nav.component.ts', ['badgeVariant']],
  ['notification-center/neu-notification-center.component.ts', ['type']],
  ['progress-bar/neu-progress-bar.component.ts', ['variant']],
  ['spinner/neu-spinner.component.ts', ['severity']],
  ['tag/neu-tag.component.ts', ['severity', 'outline']],
  ['timeline/neu-timeline.component.ts', ['compact', 'variant']],
  ['timeline-grid/neu-timeline-grid.component.ts', ['compact', 'variant']],
  ['toast/neu-toast.types.ts', ['type']],
  ['toolbar/neu-toolbar.component.ts', ['surface', 'compact']],
]);

const requiredInputAxes = new Map([
  ['alert/neu-alert.component.ts', { tone: 'info', variant: 'soft' }],
  ['autocomplete/neu-autocomplete.component.ts', { variant: 'outline' }],
  ['badge/neu-badge.component.ts', { tone: 'neutral', variant: 'soft' }],
  ['button/neu-button.component.ts', { tone: 'brand', variant: 'solid' }],
  ['chip/neu-chip.component.ts', { tone: 'neutral' }],
  ['code-block/neu-code-block.component.ts', { density: 'normal' }],
  ['empty-state/neu-empty-state.component.ts', { density: 'normal' }],
  ['input-tags/neu-input-tags.component.ts', { variant: 'outline' }],
  ['progress-bar/neu-progress-bar.component.ts', { tone: 'brand' }],
  ['select/neu-select.component.ts', { variant: 'outline' }],
  ['spinner/neu-spinner.component.ts', { tone: 'brand' }],
  ['split-button/neu-split-button.component.ts', { tone: 'brand', variant: 'solid' }],
  ['tag/neu-tag.component.ts', { tone: 'neutral', variant: 'soft' }],
  ['timeline/neu-timeline.component.ts', { density: 'normal' }],
  ['timeline-grid/neu-timeline-grid.component.ts', { density: 'normal' }],
  ['toolbar/neu-toolbar.component.ts', { tone: 'neutral', variant: 'soft', density: 'normal' }],
]);

function source(relPath) {
  const path = join(uiCore, relPath);
  return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
}

function literalUnion(node) {
  if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) return [node.literal.text];
  if (ts.isUnionTypeNode(node)) return node.types.flatMap(literalUnion);
  return [];
}

for (const [key, expected] of aliases) {
  const separator = key.lastIndexOf(':');
  const relPath = key.slice(0, separator);
  const aliasName = key.slice(separator + 1);
  const sf = source(relPath);
  const declaration = sf.statements.find(
    (node) => ts.isTypeAliasDeclaration(node) && node.name.text === aliasName,
  );
  if (!declaration) {
    failures.push(`${key}: missing type alias`);
    continue;
  }
  const actual = literalUnion(declaration.type);
  if (actual.join('|') !== expected.join('|'))
    failures.push(`${key}: expected ${expected.join('|')}, received ${actual.join('|')}`);
}

function memberNames(sf) {
  const names = new Set();
  function visit(node) {
    if ((ts.isPropertySignature(node) || ts.isPropertyDeclaration(node)) && node.name) {
      const name = node.name.getText(sf).replace(/^['"]|['"]$/g, '');
      names.add(name);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return names;
}

function inputMembers(sf) {
  const names = new Map();
  function visit(node) {
    if (ts.isPropertyDeclaration(node) && node.name && node.initializer) {
      const call = node.initializer;
      if (ts.isCallExpression(call)) {
        const callee = call.expression.getText(sf).replace(/\.required$/, '');
        if (callee === 'input') {
          const argument = call.arguments[0];
          names.set(
            node.name.getText(sf),
            argument && ts.isStringLiteral(argument) ? argument.text : undefined,
          );
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return names;
}

for (const [relPath, forbidden] of forbiddenMembers) {
  const names = memberNames(source(relPath));
  for (const name of forbidden) if (names.has(name)) failures.push(`${relPath}: legacy member ${name}`);
}

for (const [relPath, required] of requiredInputAxes) {
  const inputs = inputMembers(source(relPath));
  for (const [name, defaultValue] of Object.entries(required)) {
    if (!inputs.has(name)) failures.push(`${relPath}: ${name} must be a signal input`);
    else if (inputs.get(name) !== defaultValue)
      failures.push(`${relPath}: ${name} default must be ${defaultValue}`);
  }
}

const removedTokens = [
  '--neu-color-primary',
  '--neu-color-primary-alpha',
  '--neu-color-secondary',
  '--neu-color-border',
  '--neu-color-success',
  '--neu-color-warning',
  '--neu-danger',
  '--neu-color-danger',
  '--neu-radius-md',
  '--neu-color-picker-bg',
  '--neu-color-picker-shadow',
  '--neu-color-surface-subtle',
  '--neu-color-text-secondary',
  '--neu-nav-toggle-color-hover',
];
const unresolvedLegacyTokenReferences = [
  '--neu-color-focus',
  '--neu-color-surface',
  '--neu-color-text',
];

function filesUnder(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return filesUnder(path);
    return /\.(?:ts|html|scss)$/.test(name) ? [path] : [];
  });
}

for (const path of filesUnder(uiCore)) {
  if (path.endsWith('neu-token-name.generated.ts')) continue;
  const text = readFileSync(path, 'utf8');
  for (const token of [...removedTokens, ...unresolvedLegacyTokenReferences])
    if (text.includes(token)) failures.push(`${relative(root, path)}: removed token ${token}`);
}

const allTargetSource = [...aliases.keys(), ...forbiddenMembers.keys()]
  .map((key) => key.split(':')[0])
  .filter((value, index, values) => values.indexOf(value) === index)
  .map((path) => readFileSync(join(uiCore, path), 'utf8'))
  .join('\n');
for (const name of ['NeuToastType', 'NeuCalendarEventVariant'])
  if (allTargetSource.includes(name)) failures.push(`removed public alias remains: ${name}`);

if (failures.length) {
  console.error(`N2-023 visual nomenclature audit failed:\n${failures.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log(
  `N2-023 visual nomenclature audit passed: ${aliases.size} closed unions, ${requiredInputAxes.size} signal-input contracts, ${removedTokens.length} removed token aliases.`,
);
