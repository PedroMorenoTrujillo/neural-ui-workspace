import { describe, expect, it } from 'vitest';
import { neuPresetCss, type NeuPreset } from './neu-preset';

describe('static presets', () => {
  it('emits nothing without overrides', () => {
    expect(neuPresetCss('custom', {})).toBe('');
    expect(neuPresetCss('custom', { light: {} })).toBe('');
  });
  it('preserves CSS values and independent modes deterministically', () => {
    const preset = { light: { '--neu-text': 'var(--app-text)', '--neu-radius': 'calc(1rem / 2)' }, dark: { '--neu-text': '#fff' } } satisfies NeuPreset;
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
    for (const value of ['red; color: blue', 'red!important', 'red/*', '</style>', '{}', Number.NaN]) {
      expect(() => neuPresetCss('safe', { light: { '--neu-text': value } })).toThrow();
    }
  });
});
