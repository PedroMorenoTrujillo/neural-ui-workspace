import { describe, expect, it } from 'vitest';
import {
  NeuSrgbColor,
  OKLCH_GAMUT_MAP_MAX_ITERATIONS,
  colorsEqual,
  hslToSrgb,
  hsvToSrgb,
  oklchToSrgb,
  parseColor,
  serializeColor,
  srgbToHsl,
  srgbToHsv,
  srgbToOklch,
  wrapHue,
} from './color-utils';

const vectors: ReadonlyArray<readonly [string, NeuSrgbColor]> = [
  ['#ff0000', { red: 1, green: 0, blue: 0, alpha: 1 }],
  ['#00ff00', { red: 0, green: 1, blue: 0, alpha: 1 }],
  ['#0000ff', { red: 0, green: 0, blue: 1, alpha: 1 }],
  ['#ffffff', { red: 1, green: 1, blue: 1, alpha: 1 }],
  ['#000000', { red: 0, green: 0, blue: 0, alpha: 1 }],
  ['#808080', { red: 128 / 255, green: 128 / 255, blue: 128 / 255, alpha: 1 }],
  ['#33669980', { red: 0.2, green: 0.4, blue: 0.6, alpha: 128 / 255 }],
  ['#0000', { red: 0, green: 0, blue: 0, alpha: 0 }],
];

describe('color utilities', () => {
  it.each(vectors)('parses reference vector %s', (text, expected) => {
    expect(parseColor(text)?.color).toEqual(expected);
  });

  it('parses shorthand HEXA and emits RRGGBBAA rather than ARGB', () => {
    const color = parseColor('#3698')?.color;
    expect(color).toEqual({
      red: 0x33 / 255,
      green: 0x66 / 255,
      blue: 0x99 / 255,
      alpha: 0x88 / 255,
    });
    expect(serializeColor(color!, 'hex', true)).toBe('#33669988');
  });

  it.each([
    ['rgb(255, 0, 127)', '#ff007fff'],
    ['rgba(255, 0, 127, 0.5)', '#ff007f80'],
    ['rgb(100% 0% 50% / 25%)', '#ff008040'],
    ['rgb(300 -2 127 / 2)', '#ff007fff'],
  ])('parses RGB syntax %s', (text, expectedHex) => {
    const color = parseColor(text)?.color;
    expect(color).toBeTruthy();
    expect(serializeColor(color!, 'hex', true)).toBe(expectedHex);
  });

  it.each([
    ['hsl(0, 100%, 50%)', '#ff0000'],
    ['hsla(120, 100%, 50%, 50%)', '#00ff0080'],
    ['hsl(240 100% 50% / .25)', '#0000ff40'],
    ['hsl(-120deg 100 50)', '#0000ff'],
  ])('parses HSL syntax %s', (text, expectedHex) => {
    const color = parseColor(text)?.color;
    expect(color).toBeTruthy();
    expect(serializeColor(color!, 'hex', text.includes('/') || text.startsWith('hsla'))).toBe(
      expectedHex,
    );
  });

  it('parses OKLCH with alpha and maps it into finite sRGB', () => {
    const parsed = parseColor('oklch(65% 0.4 250 / 60%)');
    expect(parsed?.hueHint).toBe(250);
    expect(parsed?.color.alpha).toBe(0.6);
    for (const value of Object.values(parsed!.color)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it.each([
    '',
    '#12',
    '#gggggg',
    'rgb(1 2)',
    'rgb(1, 2, 3, 4, 5)',
    'rgb(NaN 2 3)',
    'rgb(Infinity 2 3)',
    'rgb(--1 2 3)',
    'rgb(1 2 3) trailing',
    'rgb(1 2 3 / 50% / 25%)',
    'hsl(0 20 30 / nope)',
    'hsl(0 20%)',
    'hsl(NaN 20% 30%)',
    'hsl(Infinity 20% 30%)',
    'hsl(turn 20% 30%)',
    'hsl(0 20% 30% / 50% / 25%)',
    'oklch(0.5, 0.2, 30)',
    'oklch(0.5 0.2)',
    'oklch(0.5 nope 30)',
    'oklch(0.5 --0.2 30)',
    'oklch(0.5 0.2 Infinity)',
    'oklch(0.5 0.2 30) trailing',
    '#12345',
    '#1234567',
    'transparent',
  ])('rejects malformed input %s', (text) => {
    expect(parseColor(text)).toBeNull();
  });

  it('matches authoritative OKLCH reference vectors within tolerance', () => {
    // Björn Ottosson/CSS Color 4 matrices: sRGB red ≈ oklch(0.627955 0.257683 29.234).
    const red = srgbToOklch({ red: 1, green: 0, blue: 0, alpha: 1 });
    expect(red.lightness).toBeCloseTo(0.627955, 5);
    expect(red.chroma).toBeCloseTo(0.257683, 5);
    expect(red.hue).toBeCloseTo(29.234, 2);
    const reconstructed = oklchToSrgb(red.lightness, red.chroma, red.hue);
    expect(reconstructed.red).toBeCloseTo(1, 5);
    expect(reconstructed.green).toBeCloseTo(0, 5);
    expect(reconstructed.blue).toBeCloseTo(0, 5);
  });

  it('bounds out-of-gamut OKLCH mapping to 24 iterations while preserving L and hue', () => {
    expect(OKLCH_GAMUT_MAP_MAX_ITERATIONS).toBe(24);
    const mapped = oklchToSrgb(0.7, 0.5, 40, 0.5);
    const result = srgbToOklch(mapped, 40);
    expect(result.lightness).toBeCloseTo(0.7, 5);
    expect(result.hue).toBeCloseTo(40, 3);
    expect(result.chroma).toBeLessThan(0.5);
    expect(mapped.alpha).toBe(0.5);
  });

  it('preserves the hue hint for achromatic HSV, HSL and OKLCH colors', () => {
    const gray = { red: 0.5, green: 0.5, blue: 0.5, alpha: 1 };
    expect(srgbToHsv(gray, 275).hue).toBe(275);
    expect(srgbToHsl(gray, 275).hue).toBe(275);
    expect(srgbToOklch(gray, 275).hue).toBe(275);
  });

  it.each([
    ['gray', { red: 0.5, green: 0.5, blue: 0.5, alpha: 1 }],
    ['black', { red: 0, green: 0, blue: 0, alpha: 1 }],
    ['white', { red: 1, green: 1, blue: 1, alpha: 1 }],
  ])(
    'retains hue 275 for achromatic %s across every private/public cylindrical model',
    (_, color) => {
      expect(srgbToHsv(color, 275).hue).toBe(275);
      expect(srgbToHsl(color, 275).hue).toBe(275);
      expect(srgbToOklch(color, 275).hue).toBe(275);
    },
  );

  it('preserves authored hue for zero-chroma OKLCH', () => {
    const parsed = parseColor('oklch(0.6 0 315)');
    expect(parsed?.hueHint).toBe(315);
    expect(srgbToOklch(parsed!.color, parsed!.hueHint).hue).toBe(315);
  });

  it('clamps approved overflow syntax to finite bounded canonical channels', () => {
    for (const text of [
      'rgb(999 -20 500 / 200%)',
      'hsl(900 200% -20% / -1)',
      'oklch(200% -1 -720 / 4)',
    ]) {
      const parsed = parseColor(text);
      expect(parsed).toBeTruthy();
      for (const value of Object.values(parsed!.color)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it('wraps hue to the half-open 0..360 interval', () => {
    expect(wrapHue(-1)).toBe(359);
    expect(wrapHue(360)).toBe(0);
    expect(wrapHue(721)).toBe(1);
  });

  it('round-trips RGB through HSL and HSV on deterministic channel samples', () => {
    for (const red of [0, 0.17, 0.5, 1]) {
      for (const green of [0, 0.33, 0.8, 1]) {
        for (const blue of [0, 0.25, 0.67, 1]) {
          const source = { red, green, blue, alpha: 0.37 };
          const hsl = srgbToHsl(source, 42);
          const fromHsl = hslToSrgb(hsl.hue, hsl.saturation, hsl.lightness, source.alpha);
          expect(colorsEqual(source, fromHsl, 1e-6)).toBe(true);
          const hsv = srgbToHsv(source, 42);
          const fromHsv = hsvToSrgb(hsv.hue, hsv.saturation, hsv.value, source.alpha);
          expect(colorsEqual(source, fromHsv, 1e-6)).toBe(true);
          for (const channel of Object.values(fromHsl).concat(Object.values(fromHsv))) {
            expect(Number.isFinite(channel)).toBe(true);
          }
        }
      }
    }
  });

  it('round-trips in-gamut sRGB through OKLCH on deterministic samples', () => {
    for (const source of vectors.map(([, color]) => color)) {
      const oklch = srgbToOklch(source, 180);
      const reconstructed = oklchToSrgb(oklch.lightness, oklch.chroma, oklch.hue, source.alpha);
      expect(colorsEqual(source, reconstructed, 2e-5)).toBe(true);
    }
  });

  it('round-trips every public string format within documented tolerances', () => {
    const source = { red: 51 / 255, green: 102 / 255, blue: 153 / 255, alpha: 0.42 };
    for (const mode of ['hex', 'rgb', 'hsl', 'oklch'] as const) {
      const serialized = serializeColor(source, mode, true, 210);
      const reparsed = parseColor(serialized)?.color;
      expect(reparsed).toBeTruthy();
      expect(colorsEqual(source, reparsed!, mode === 'hex' ? 1 / 255 : 5e-4)).toBe(true);
    }
  });

  it('uses stable opaque legacy output and modern slash-alpha output', () => {
    const color = { red: 1, green: 0.5, blue: 0, alpha: 0.25 };
    expect(serializeColor(color, 'rgb', false)).toBe('rgb(255, 128, 0)');
    expect(serializeColor(color, 'rgb', true)).toBe('rgb(255 128 0 / 0.25)');
    expect(serializeColor(color, 'hsl', false)).toMatch(/^hsl\(.+, .+%, .+%\)$/);
    expect(serializeColor(color, 'hsl', true)).toMatch(/^hsl\(.+ .+% .+% \/ 0\.25\)$/);
  });
});
