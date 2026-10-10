import { describe, expect, it } from 'vitest';
import { defineNeuPreset, neuPresetCss, ɵNEU_PRESET_INSTALL, type NeuPreset } from './neu-preset';

describe('static presets', () => {
  it('emits nothing without overrides', () => {
    expect(neuPresetCss('custom', {})).toBe('');
    expect(neuPresetCss('custom', { light: {} })).toBe('');
  });
  it('preserves CSS values and independent modes deterministically', () => {
    const preset = {
      light: { '--neu-text': 'var(--app-text)', '--neu-radius': 'calc(1rem / 2)' },
      dark: { '--neu-text': '#fff' },
    } satisfies NeuPreset;
    const css = neuPresetCss('custom', preset);
    expect(css).toContain('--neu-text: var(--app-text);');
    expect(css).toContain(':not([data-theme="dark"])');
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain(':not([data-neu-theme="high-contrast"])');
    expect(css).toContain('@media not (forced-colors: active)');
    expect(css).toBe(neuPresetCss('custom', preset));
    expect(css.split('[data-theme="dark"] {')[1]).not.toContain('--neu-radius');
  });
  it('supports token-level composition without mutating either map', () => {
    const base = Object.freeze({ '--neu-text': '#111', '--neu-radius': 0 } as const);
    const light = { ...base, '--neu-text': '#222' };
    expect(neuPresetCss('custom', { light })).toContain('--neu-text: #222;');
    expect(neuPresetCss('custom', { light })).toContain('--neu-radius: 0;');
    expect(base['--neu-text']).toBe('#111');
  });
  it('rejects invalid identifiers and escaping declarations', () => {
    expect(() => neuPresetCss('bad"]', {})).toThrow();
    for (const value of [
      'red; color: blue',
      'red!important',
      'red/*',
      '</style>',
      '{}',
      Number.NaN,
    ]) {
      expect(() => neuPresetCss('safe', { light: { '--neu-text': value } })).toThrow();
    }
  });

  it('defines and validates a named preset without losing its literal type', () => {
    const forest = defineNeuPreset({
      name: 'forest',
      light: { '--neu-primary': '#166534' },
      dark: { '--neu-primary': '#86efac' },
    });

    expect(forest.name).toBe('forest');
    expect(forest.light['--neu-primary']).toBe('#166534');
    expect(ɵNEU_PRESET_INSTALL).toBe('ɵneuPresetInstall');
    expect(typeof forest[ɵNEU_PRESET_INSTALL]).toBe('function');
    expect(Object.getOwnPropertyDescriptor(forest, ɵNEU_PRESET_INSTALL)?.enumerable).toBe(false);
    const target = document.implementation.createHTMLDocument('Preset');
    // Angular's server DOM implements appendChild, but not Element.append.
    Object.defineProperty(target.head, 'append', { value: undefined });
    forest[ɵNEU_PRESET_INSTALL](target, 'preset-nonce');
    forest[ɵNEU_PRESET_INSTALL](target, 'preset-nonce');
    const styles = target.head.querySelectorAll('style[data-neu-preset-style="forest"]');
    expect(styles).toHaveLength(1);
    expect(styles[0].getAttribute('nonce')).toBe('preset-nonce');
    expect(styles[0].textContent).toContain('--neu-primary: #166534;');
    expect(() => defineNeuPreset({ name: 'bad"]', light: { '--neu-primary': '#166534' } })).toThrow(
      'Preset name',
    );
  });
});
