import type { NeuTokenName } from './neu-token-name.generated';

/** Practical CSS values; token names, rather than CSS syntax, are typed. */
export type NeuPresetTokens = Readonly<Partial<Record<NeuTokenName, string | number>>>;

/** Independent light/dark overrides of existing public Neural tokens. */
export interface NeuPreset {
  readonly light?: NeuPresetTokens;
  readonly dark?: NeuPresetTokens;
}

/**
 * Generate a stylesheet at build time and load it after Neural styles.
 * Activate on html with data-neu-preset; existing data-theme selects dark.
 * High contrast and forced colors retain library defaults. No DOM access.
 * Accepts trusted design configuration, not untrusted user-provided CSS.
 */
export function neuPresetCss(name: string, preset: NeuPreset): string {
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    throw new Error('Preset name must be an ASCII identifier beginning with a letter.');
  }
  const root = `:root[data-neu-preset="${name}"]:not([data-neu-theme="high-contrast"])`;
  const rule = (selector: string, tokens: NeuPresetTokens | undefined): string => {
    const declarations = Object.entries(tokens ?? {}).sort(([a], [b]) => a.localeCompare(b, 'en')).map(([token, value]) => {
      if (!/^--neu-[a-z0-9-]+$/.test(token) ||
          (typeof value !== 'string' && typeof value !== 'number') ||
          (typeof value === 'number' && !Number.isFinite(value)) ||
          /[;{}<>]|\/\*|!\s*important/i.test(String(value))) {
        throw new Error(`Invalid preset declaration: ${token}`);
      }
      return `  ${token}: ${value};`;
    });
    return declarations.length ? `${selector} {\n${declarations.join('\n')}\n}` : '';
  };
  const rules = [rule(`${root}:not([data-theme="dark"])`, preset.light), rule(`${root}[data-theme="dark"]`, preset.dark)].filter(Boolean);
  return rules.length ? `@media not (forced-colors: active) {\n${rules.join('\n')}\n}\n` : '';
}
