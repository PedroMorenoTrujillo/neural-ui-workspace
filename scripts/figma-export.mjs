#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const scriptPath = fileURLToPath(import.meta.url);
const workspaceRoot = path.resolve(path.dirname(scriptPath), '..');
const uiCoreRoot = path.join(workspaceRoot, 'projects', 'ui-core');
const DEFAULT_OUTPUT_DIR = path.join(os.tmpdir(), 'neural-ui-workspace-figma-migration');
const outDir = process.env.FIGMA_MIGRATION_DIR
  ? path.resolve(process.env.FIGMA_MIGRATION_DIR)
  : DEFAULT_OUTPUT_DIR;

const FILE_GLOBS = {
  component: /neu-[a-z0-9-]+\.(component|directive|service|overlay|host|dialog|panel)\.ts$/,
  scss: /\.scss$/,
  spec: /\.spec\.ts$/,
};

const strip = (value) =>
  value
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+\/\*.*?\*\//g, '')
    .replace(/\s+\/\/.*$/gm, '');

function resolveFileList(dir) {
  return fs.readdir(dir, { withFileTypes: true }).then((items) =>
    items
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => name.endsWith('.ts') || name.endsWith('.scss'))
      .map((name) => path.join(dir, name)),
  );
}

function readText(file) {
  return fs.readFile(file, 'utf8');
}

function extractSelector(content) {
  const selectorMatch = content.match(/selector:\s*['\"]([^'\"]+)['\"]/);
  return selectorMatch ? selectorMatch[1] : null;
}

function extractClassName(content) {
  const classMatch = content.match(/export\s+class\s+([A-Za-z0-9_]+)/);
  return classMatch ? classMatch[1] : null;
}

function extractImportsFromPublicApi(content) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines
    .filter((line) => line.startsWith('export * from'))
    .map((line) => line.replace(/\s*;/g, '').replace(/^export \* from /, '').replace(/["']/g, ''));
}

function mergeUnique(values) {
  return [...new Set(values)];
}

function extractSignals(content) {
  const lines = content.split('\n');
  const inputs = [];
  const outputs = [];

  const inputDecl = /\b(\w+)\s*=\s*input\s*<[^>]*>??\s*\(/g;
  const outputDecl = /\b(\w+)\s*=\s*output\s*<[^>]*>??\s*\(/g;

  let match;
  while ((match = inputDecl.exec(content)) !== null) {
    inputs.push(match[1]);
  }

  while ((match = outputDecl.exec(content)) !== null) {
    outputs.push(match[1]);
  }

  const linesLegacy = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => strip(l));

  const hasLegacyInput = linesLegacy.some((line) => line.startsWith('@Input()'));
  const hasLegacyOutput = linesLegacy.some((line) => line.startsWith('@Output()'));

  if (hasLegacyInput) {
    inputs.push('@Input');
  }

  if (hasLegacyOutput) {
    outputs.push('@Output');
  }

  return { inputs: mergeUnique(inputs), outputs: mergeUnique(outputs) };
}

function extractSelectorsFromDemos(content) {
  const selectors = [];
  const matcher = /selector:\s*`([^`]+)`|selector:\s*'([^']+)'|selector:\s*"([^"]+)"/g;
  let m;
  while ((m = matcher.exec(content)) !== null) {
    const value = m[1] || m[2] || m[3];
    if (value) selectors.push(value.trim());
  }
  return selectors;
}

function extractTokenValue(line) {
  const m = line.match(/^\s*--([^:]+)\s*:\s*(.+)\s*;/);
  return m ? { name: `--${m[1].trim()}`, value: m[2].trim() } : null;
}

function parseTokenBlocks(content, theme) {
  const lines = content.split('\n');
  const startLine = lines.findIndex((line) => line.trim().startsWith(`:root`) || line.trim().startsWith("[data-theme='dark']"));

  if (startLine < 0) {
    return [];
  }

  const out = [];
  let collecting = false;
  for (let i = startLine; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (line === '{') {
      collecting = true;
      continue;
    }

    if (!collecting) {
      if (line.endsWith('{')) {
        collecting = true;
      }
      continue;
    }

    if (line === '}') {
      break;
    }

    const token = extractTokenValue(lines[i]);
    if (token) {
      out.push({ ...token, theme });
    }
  }

  return out;
}

function normalizeComponentName(name) {
  return name
    .replace(/\.ts$/i, '')
    .replace(/^neu-/, '')
    .replace(/\.(?:component|directive|service|overlay|host|dialog|panel)$/, '')
    .toLowerCase();
}

function extractDemoFileForComponent(componentName, showcaseRoot) {
  const candidates = new Set();

  const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && full.endsWith('.ts') && !full.endsWith('.spec.ts')) {
        const text = await readText(full);
        const selectors = extractSelectorsFromDemos(text);
        if (
          selectors.includes(`neu-${componentName}`) ||
          selectors.includes(`button[neu-${componentName}]`) ||
          full.includes(`pages/${componentName}-demo`) ||
          full.includes(`pages/${componentName}-demo`)
        ) {
          candidates.add(full.replace(`${workspaceRoot}/`, ''));
        }
      }
    }
  };

  if (!showcaseRoot) {
    return [];
  }

  return walk(showcaseRoot).then(() => [...candidates]);
}

async function buildManifest() {
  const dirs = await fs.readdir(uiCoreRoot, { withFileTypes: true });
  const publicApiDirList = dirs.filter((entry) => entry.isDirectory()).map((entry) => path.join(uiCoreRoot, entry.name));
  const showcaseRoot = path.join(workspaceRoot, '..', 'neural-ui-showcase', 'projects', 'showcase', 'src', 'app', 'pages');

  const hasShowcase = await fs
    .access(showcaseRoot)
    .then(() => true)
    .catch(() => false);

  const components = [];

  for (const dir of publicApiDirList) {
    const publicApiPath = path.join(dir, 'public_api.ts');

    try {
      await fs.access(publicApiPath);
    } catch {
      continue;
    }

    const publicApi = await readText(publicApiPath);
    const exports = extractImportsFromPublicApi(publicApi);

    const srcFiles = (await resolveFileList(dir)).filter((file) => FILE_GLOBS.component.test(file) && !FILE_GLOBS.spec.test(file));

    if (!srcFiles.length) {
      continue;
    }

    const mainFile = srcFiles[0];
    const content = await readText(mainFile);

    const signals = extractSignals(content);

    const selector = extractSelector(content);
    const className = extractClassName(content);
    const demos = hasShowcase
      ? await extractDemoFileForComponent(path.basename(dir), showcaseRoot)
      : [];

    components.push({
      packageEntry: path.relative(uiCoreRoot, dir),
      publicApi: {
        file: path.relative(uiCoreRoot, publicApiPath),
        exports,
      },
      implementation: {
        file: path.relative(uiCoreRoot, mainFile),
        selector,
        className,
        signals,
      },
      additionalFiles: srcFiles.map((file) => path.relative(uiCoreRoot, file)),
      showcaseReferences: demos,
      generatedAt: new Date().toISOString(),
    });
  }

  const tokensFile = path.join(uiCoreRoot, 'styles', '_tokens.scss');
  const tokensText = await readText(tokensFile);

  const rootTokens = parseTokenBlocks(tokensText, 'light');

  const darkBlockStart = tokensText.indexOf("[data-theme='dark']");
  let darkTokens = [];
  if (darkBlockStart >= 0) {
    darkTokens = parseTokenBlocks(tokensText.slice(darkBlockStart), 'dark');
  }

  const tokenMap = new Map();
  const orderedTokens = [];

  for (const t of [...rootTokens, ...darkTokens]) {
    if (!tokenMap.has(t.name)) {
      tokenMap.set(t.name, { name: t.name });
    }
    tokenMap.get(t.name)[t.theme] = t.value;
  }

  for (const [name, payload] of tokenMap.entries()) {
    orderedTokens.push({
      name,
      light: payload.light,
      dark: payload.dark || null,
      category: name.split('-')[1] || 'global',
    });
  }

  orderedTokens.sort((a, b) => a.name.localeCompare(b.name));

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: {
      workspace: workspaceRoot,
      uiCore: uiCoreRoot,
      tokensFile: path.relative(workspaceRoot, tokensFile),
    },
    totals: {
      components: components.length,
      tokens: orderedTokens.length,
    },
    components: components.sort((a, b) => a.packageEntry.localeCompare(b.packageEntry)),
    tokens: orderedTokens,
    figmaGuide: {
      modeHandling: 'importa light y dark como dos sets de variables o variantes',
      recommendedVariantKeys: ['variant', 'size', 'state', 'tone', 'density', 'disabled'],
      componentStateRule: 'si un input/output cambia en código, regenerar este manifiesto y validar Figma',
    },
  };

  await fs.mkdir(outDir, { recursive: true });

  await fs.writeFile(
    path.join(outDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  const figmaStyleTokens = {
    generatedAt: new Date().toISOString(),
    light: orderedTokens.reduce((acc, token) => {
      if (token.light) {
        acc[token.name.replace(/^--/, '')] = { value: token.light, type: inferTokenType(token.light) };
      }
      return acc;
    }, {}),
    dark: orderedTokens.reduce((acc, token) => {
      if (token.dark) {
        acc[token.name.replace(/^--/, '')] = { value: token.dark, type: inferTokenType(token.dark) };
      }
      return acc;
    }, {}),
  };

  await fs.writeFile(
    path.join(outDir, 'figma-tokens-ready.json'),
    `${JSON.stringify(figmaStyleTokens, null, 2)}\n`,
    'utf8',
  );

  const componentApi = components.map((item) => ({
    component: item.packageEntry,
    selector: item.implementation.selector,
    className: item.implementation.className,
    inputs: item.implementation.signals.inputs,
    outputs: item.implementation.signals.outputs,
    publicExports: item.publicApi.exports,
    showcaseReferences: item.showcaseReferences,
  }));

  await fs.writeFile(
    path.join(outDir, 'component-api.csv'),
    ['component,selector,className,inputs,outputs,publicExports,showcaseReferences']
      .concat(
        componentApi.map((entry) =>
          [
            entry.component,
            entry.selector || '',
            entry.className || '',
            entry.inputs.join('|') || '',
            entry.outputs.join('|') || '',
            `"${entry.publicExports.join(' | ')}"`,
            `"${entry.showcaseReferences.join(' | ')}"`,
          ].join(','),
        ),
      )
      .join('\n') + '\n',
    'utf8',
  );

  console.log(`✅ Updated figma migration artifacts at: ${outDir}`);
  console.log(`- manifest.json -> ${path.join(outDir, 'manifest.json')}`);
  console.log(`- figma-tokens-ready.json -> ${path.join(outDir, 'figma-tokens-ready.json')}`);
  console.log(`- component-api.csv -> ${path.join(outDir, 'component-api.csv')}`);
}

function inferTokenType(value) {
  const v = (value || '').toLowerCase();
  if (v.startsWith('#') || v.startsWith('rgb') || v.startsWith('hsl') || v.startsWith('var(') || /rgba\(/.test(v) || /hsla\(/.test(v)) {
    return 'color';
  }
  if (/\b\d+(\.\d+)?(px|rem|em|vh|vw|%)$/.test(v)) {
    return 'dimension';
  }
  if (/\b\d+(\.\d+)?(ms|s)$/.test(v)) {
    return 'duration';
  }
  if (v.includes('0 1px') || v.includes('box-shadow') || /shadow|inset/.test(v)) {
    return 'boxShadow';
  }
  if (/^\d+px$/.test(v)) {
    return 'dimension';
  }
  if (/^[\d\.]+$/.test(v)) {
    return 'number';
  }
  return 'string';
}

await buildManifest();
