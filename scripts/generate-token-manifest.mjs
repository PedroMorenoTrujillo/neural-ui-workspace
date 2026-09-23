import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { relative, join } from 'node:path';

const ROOT = process.cwd();
const SOURCE = 'projects/ui-core';
const TOKENS_FILE = `${SOURCE}/styles/_tokens.scss`;
const OUTPUT = `${SOURCE}/token-manifest.json`;

// These properties carry per-instance geometry from Angular to CSS. They were
// never documented as consumer theme API and intentionally stay private.
const INTERNAL_RUNTIME_TOKENS = new Set([
  '--neu-cp-check-a',
  '--neu-cp-check-b',
  '--neu-cp-color',
  '--neu-cp-opaque',
  '--neu-dg-cols',
  '--neu-dg-gap',
  '--neu-dg-content-gap',
  '--neu-kanban-column-width',
  '--neu-listbox-item-size',
  '--neu-speed-delay',
  '--neu-speed-index',
  '--neu-speed-x',
  '--neu-speed-y',
  '--neu-speed-offset',
  '--neu-timeline-grid-min-column-width',
]);

const COMPONENT_LOCAL_TOKENS = new Set([
  '--neu-button-ghost-hover-bg',
  '--neu-control-gap',
  '--neu-control-height',
  '--neu-control-padding-inline',
  '--neu-density-scale',
]);

// Public component tokens deliberately use a semantic fallback at their point
// of use. Declaring these aliases at :root would resolve them too early and
// prevent a local semantic override from flowing through the cascade.
const PUBLIC_COMPONENT_FALLBACKS = new Map([
  ['--neu-button-background', 'var(--neu-primary-solid)'],
  ['--neu-button-foreground', 'var(--neu-primary-solid-fg)'],
  ['--neu-button-border', 'var(--neu-primary-solid)'],
  ['--neu-button-background-hover', 'var(--neu-primary-solid-hover)'],
  ['--neu-input-background', 'var(--neu-surface)'],
  ['--neu-input-border', 'var(--neu-border)'],
  ['--neu-input-focus-border', 'var(--neu-primary)'],
  ['--neu-input-focus-ring', 'var(--neu-focus-ring)'],
]);

const COMPONENT_PREFIXES = [
  'alert',
  'autocomplete',
  'block-ui',
  'button',
  'cmd',
  'code-block',
  'color-picker',
  'context-menu',
  'dialog',
  'image-viewer',
  'knob',
  'meter',
  'nav',
  'notification',
  'number-input',
  'otp',
  'popover',
  'scroll-area',
  'select',
  'sidebar',
  'split-button',
  'splitter',
  'spinner',
  'stepper',
  'table',
  'terminal',
  'toolbar',
  'toast',
  'tooltip',
];

function filesIn(directory) {
  return readdirSync(join(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory()
      ? filesIn(file)
      : /\.(scss|css|ts|html)$/.test(file) && !file.endsWith('.spec.ts') && !file.endsWith('neu-token-name.generated.ts')
        ? [file]
        : [];
  });
}

function tokenNames(source) {
  return [...source.matchAll(/--neu-[a-z0-9]+(?:-[a-z0-9]+)*(?![a-z0-9-])/gi)].map((match) =>
    match[0].toLowerCase(),
  );
}

function declarations(source) {
  return [...source.matchAll(/(--neu-[a-z0-9]+(?:-[a-z0-9]+)*)\s*:\s*([^;]+);/gi)].map((match) => ({
    token: match[1].toLowerCase(),
    value: match[2].replace(/\s+/g, ' ').trim(),
  }));
}

function category(token) {
  const name = token.slice(6);
  if (
    /^(space|radius|font|text-(xs|sm|base|lg|xl|2xl|3xl|4xl)|transition|z-|shadow|icon-)/.test(name)
  )
    return 'foundation';
  if (COMPONENT_PREFIXES.some((prefix) => name === prefix || name.startsWith(`${prefix}-`)))
    return 'component';
  return 'semantic';
}

function owner(token, tokenCategory) {
  if (tokenCategory !== 'component') return tokenCategory === 'foundation' ? 'global' : 'semantic';
  return (
    COMPONENT_PREFIXES.find(
      (prefix) => token.slice(6) === prefix || token.slice(6).startsWith(`${prefix}-`),
    ) ?? 'component'
  );
}

function description(token, tokenCategory) {
  const words = token.slice(6).replaceAll('-', ' ');
  if (tokenCategory === 'foundation') return `Foundation token for ${words}.`;
  if (tokenCategory === 'semantic') return `Semantic token for ${words}.`;
  return `Component token for ${words}.`;
}

const allFiles = filesIn(SOURCE);
const references = new Map();
const declaredIn = new Map();
for (const file of allFiles) {
  const source = readFileSync(join(ROOT, file), 'utf8');
  for (const token of tokenNames(source))
    (references.get(token) ?? references.set(token, new Set()).get(token)).add(file);
  for (const { token } of declarations(source))
    (declaredIn.get(token) ?? declaredIn.set(token, new Set()).get(token)).add(file);
}

const tokenSource = readFileSync(join(ROOT, TOKENS_FILE), 'utf8');
const lightTheme = tokenSource.split("[data-theme='dark']")[0];
const rootDefaults = new Map();
for (const declaration of declarations(lightTheme))
  if (!rootDefaults.has(declaration.token)) rootDefaults.set(declaration.token, declaration.value);

const tokens = [...new Set([...references.keys(), ...rootDefaults.keys()])].sort().map((token) => {
  const runtimeInternal = INTERNAL_RUNTIME_TOKENS.has(token);
  const componentLocal = COMPONENT_LOCAL_TOKENS.has(token);
  const defaultValue = rootDefaults.get(token) ?? PUBLIC_COMPONENT_FALLBACKS.get(token) ?? null;
  const tokenCategory = runtimeInternal || componentLocal ? 'internal' : category(token);
  const fallback = defaultValue
    ? [...defaultValue.matchAll(/var\((--neu-[a-z0-9-]+)/g)].map((match) => match[1])
    : [];
  return {
    token,
    category: tokenCategory,
    owner: runtimeInternal
      ? 'runtime'
      : componentLocal
        ? 'component-local'
        : owner(token, tokenCategory),
    description: runtimeInternal
      ? 'Private runtime geometry; not a public theming token.'
      : componentLocal
        ? 'Component-local implementation bridge; not a global token.'
        : description(token, tokenCategory),
    default: defaultValue,
    fallback,
    declaredIn: rootDefaults.has(token) ? [TOKENS_FILE] : [...(declaredIn.get(token) ?? [])].sort(),
    defaultSource: rootDefaults.has(token)
      ? 'root'
      : PUBLIC_COMPONENT_FALLBACKS.has(token)
        ? 'component-fallback'
        : null,
    consumedIn: [...(references.get(token) ?? [])].sort(),
    public: !runtimeInternal && !componentLocal,
    documented: !runtimeInternal && !componentLocal && defaultValue !== null,
    status: runtimeInternal
      ? 'internal-runtime'
      : componentLocal
        ? 'component-local'
        : token.includes('-color-') || token === '--neu-danger' || token === '--neu-radius-md'
          ? 'compatibility-alias'
          : 'canonical',
  };
});

const manifest = {
  schemaVersion: 1,
  generatedFrom: TOKENS_FILE,
  tokenCount: tokens.length,
  publicTokenCount: tokens.filter((token) => token.public).length,
  tokens,
};

if (process.argv.includes('--check')) {
  const existing = readFileSync(join(ROOT, OUTPUT), 'utf8');
  const expected = `${JSON.stringify(manifest, null, 2)}\n`;
  if (existing !== expected)
    throw new Error('Token manifest is stale. Run npm run tokens:generate.');
  console.log(`Token manifest is current (${manifest.publicTokenCount} public tokens).`);
} else {
  writeFileSync(join(ROOT, OUTPUT), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${OUTPUT} (${manifest.publicTokenCount} public tokens).`);
}
