export interface NeuSrgbColor {
  /** Gamma-encoded sRGB red, green and blue channels in the inclusive range 0..1. */
  readonly red: number;
  readonly green: number;
  readonly blue: number;
  /** Unpremultiplied alpha in the inclusive range 0..1. */
  readonly alpha: number;
}

export interface NeuHslColor {
  readonly hue: number;
  readonly saturation: number;
  readonly lightness: number;
}

export interface NeuHsvColor {
  readonly hue: number;
  readonly saturation: number;
  readonly value: number;
}

export interface NeuOklchColor {
  readonly lightness: number;
  readonly chroma: number;
  readonly hue: number;
}

export interface NeuParsedColor {
  readonly color: NeuSrgbColor;
  /** Authored hue, including when the hue is powerless. */
  readonly hueHint?: number;
}

export type NeuColorMode = 'hex' | 'rgb' | 'hsl' | 'oklch';

const EPSILON = 1e-7;
/** Private, deterministic ceiling for one out-of-gamut OKLCH conversion. */
export const OKLCH_GAMUT_MAP_MAX_ITERATIONS = 24;

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function wrapHue(value: number): number {
  return ((value % 360) + 360) % 360;
}

function cleanNumber(value: number, precision: number): string {
  const rounded = Math.round(value * 10 ** precision) / 10 ** precision;
  return Object.is(rounded, -0) ? '0' : `${rounded}`;
}

function parseFinite(text: string): number | null {
  const value = Number(text.trim());
  return text.trim() && Number.isFinite(value) ? value : null;
}

function parsePercentageOrNumber(text: string, percentageScale = 1): number | null {
  const trimmed = text.trim();
  const isPercentage = trimmed.endsWith('%');
  const value = parseFinite(isPercentage ? trimmed.slice(0, -1) : trimmed);
  return value === null ? null : isPercentage ? (value / 100) * percentageScale : value;
}

function parseAlpha(text: string | undefined): number | null {
  if (text === undefined) return 1;
  const value = parsePercentageOrNumber(text);
  return value === null ? null : clamp(value, 0, 1);
}

function parseRgbChannel(text: string): number | null {
  const trimmed = text.trim();
  const isPercentage = trimmed.endsWith('%');
  const value = parseFinite(isPercentage ? trimmed.slice(0, -1) : trimmed);
  if (value === null) return null;
  return clamp(isPercentage ? value / 100 : value / 255, 0, 1);
}

function splitFunctionBody(body: string): { channels: string[]; alpha?: string } | null {
  if (body.includes(',')) {
    const parts = body.split(',').map((part) => part.trim());
    if (parts.length !== 3 && parts.length !== 4) return null;
    return { channels: parts.slice(0, 3), alpha: parts[3] };
  }

  const slashParts = body.split('/');
  if (slashParts.length > 2) return null;
  const channels = slashParts[0].trim().split(/\s+/).filter(Boolean);
  if (channels.length !== 3) return null;
  const alpha = slashParts[1]?.trim();
  return alpha ? { channels, alpha } : { channels };
}

function parseHex(text: string): NeuParsedColor | null {
  const match = text.match(/^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i);
  if (!match) return null;
  const compact = match[1];
  const expanded =
    compact.length <= 4 ? [...compact].map((character) => character + character).join('') : compact;
  return {
    color: {
      red: Number.parseInt(expanded.slice(0, 2), 16) / 255,
      green: Number.parseInt(expanded.slice(2, 4), 16) / 255,
      blue: Number.parseInt(expanded.slice(4, 6), 16) / 255,
      alpha: expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    },
  };
}

function parseRgb(text: string): NeuParsedColor | null {
  const match = text.match(/^rgba?\((.*)\)$/i);
  if (!match) return null;
  const parts = splitFunctionBody(match[1]);
  if (!parts) return null;
  const [red, green, blue] = parts.channels.map(parseRgbChannel);
  const alpha = parseAlpha(parts.alpha);
  if (red === null || green === null || blue === null || alpha === null) return null;
  return { color: { red, green, blue, alpha } };
}

function parseHue(text: string): number | null {
  const match = text.trim().match(/^([-+]?(?:\d+\.?\d*|\.\d+))(deg)?$/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? wrapHue(value) : null;
}

function parseHsl(text: string): NeuParsedColor | null {
  const match = text.match(/^hsla?\((.*)\)$/i);
  if (!match) return null;
  const parts = splitFunctionBody(match[1]);
  if (!parts) return null;
  const hue = parseHue(parts.channels[0]);
  const saturation = parsePercentageOrNumber(parts.channels[1], 100);
  const lightness = parsePercentageOrNumber(parts.channels[2], 100);
  const alpha = parseAlpha(parts.alpha);
  if (hue === null || saturation === null || lightness === null || alpha === null) return null;
  return {
    color: hslToSrgb(hue, clamp(saturation, 0, 100), clamp(lightness, 0, 100), alpha),
    hueHint: hue,
  };
}

function parseOklch(text: string): NeuParsedColor | null {
  const match = text.match(/^oklch\((.*)\)$/i);
  if (!match || match[1].includes(',')) return null;
  const slashParts = match[1].split('/');
  if (slashParts.length > 2) return null;
  const channels = slashParts[0].trim().split(/\s+/).filter(Boolean);
  if (channels.length !== 3) return null;
  const lightness = parsePercentageOrNumber(channels[0]);
  const chroma = parseFinite(channels[1]);
  const hue = parseHue(channels[2]);
  const alpha = parseAlpha(slashParts[1]);
  if (lightness === null || chroma === null || hue === null || alpha === null) return null;
  return {
    color: oklchToSrgb(clamp(lightness, 0, 1), clamp(chroma, 0, 0.5), hue, alpha),
    hueHint: hue,
  };
}

export function parseColor(value: string): NeuParsedColor | null {
  const text = value.trim();
  if (!text) return null;
  return parseHex(text) ?? parseRgb(text) ?? parseHsl(text) ?? parseOklch(text);
}

export function colorsEqual(a: NeuSrgbColor, b: NeuSrgbColor, tolerance = 1e-7): boolean {
  return (
    Math.abs(a.red - b.red) <= tolerance &&
    Math.abs(a.green - b.green) <= tolerance &&
    Math.abs(a.blue - b.blue) <= tolerance &&
    Math.abs(a.alpha - b.alpha) <= tolerance
  );
}

export function srgbToHsv(color: NeuSrgbColor, hueHint = 0): NeuHsvColor {
  const maximum = Math.max(color.red, color.green, color.blue);
  const minimum = Math.min(color.red, color.green, color.blue);
  const delta = maximum - minimum;
  let hue = wrapHue(hueHint);
  if (delta > EPSILON) {
    if (maximum === color.red) hue = 60 * (((color.green - color.blue) / delta) % 6);
    else if (maximum === color.green) hue = 60 * ((color.blue - color.red) / delta + 2);
    else hue = 60 * ((color.red - color.green) / delta + 4);
    hue = wrapHue(hue);
  }
  return {
    hue,
    saturation: maximum <= EPSILON ? 0 : (delta / maximum) * 100,
    value: maximum * 100,
  };
}

export function hsvToSrgb(hue: number, saturation: number, value: number, alpha = 1): NeuSrgbColor {
  const h = wrapHue(hue);
  const s = clamp(saturation, 0, 100) / 100;
  const v = clamp(value, 0, 100) / 100;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const offset = v - chroma;
  const sector = Math.floor(h / 60);
  const channels = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ][sector] ?? [chroma, 0, x];
  return {
    red: channels[0] + offset,
    green: channels[1] + offset,
    blue: channels[2] + offset,
    alpha: clamp(alpha, 0, 1),
  };
}

export function srgbToHsl(color: NeuSrgbColor, hueHint = 0): NeuHslColor {
  const maximum = Math.max(color.red, color.green, color.blue);
  const minimum = Math.min(color.red, color.green, color.blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  let hue = wrapHue(hueHint);
  let saturation = 0;
  if (delta > EPSILON) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (maximum === color.red) hue = 60 * (((color.green - color.blue) / delta) % 6);
    else if (maximum === color.green) hue = 60 * ((color.blue - color.red) / delta + 2);
    else hue = 60 * ((color.red - color.green) / delta + 4);
    hue = wrapHue(hue);
  }
  return { hue, saturation: saturation * 100, lightness: lightness * 100 };
}

export function hslToSrgb(
  hue: number,
  saturation: number,
  lightness: number,
  alpha = 1,
): NeuSrgbColor {
  const h = wrapHue(hue);
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const offset = l - chroma / 2;
  const sector = Math.floor(h / 60);
  const channels = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ][sector] ?? [chroma, 0, x];
  return {
    red: channels[0] + offset,
    green: channels[1] + offset,
    blue: channels[2] + offset,
    alpha: clamp(alpha, 0, 1),
  };
}

function encodedToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function linearToEncoded(channel: number): number {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function oklchToLinearSrgb(lightness: number, chroma: number, hue: number): readonly number[] {
  const radians = (wrapHue(hue) * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function isInSrgbGamut(channels: readonly number[]): boolean {
  return channels.every((channel) => channel >= -EPSILON && channel <= 1 + EPSILON);
}

export function oklchToSrgb(
  lightness: number,
  chroma: number,
  hue: number,
  alpha = 1,
): NeuSrgbColor {
  const l = clamp(lightness, 0, 1);
  const requestedChroma = clamp(chroma, 0, 0.5);
  let mappedChroma = requestedChroma;
  let linear = oklchToLinearSrgb(l, mappedChroma, hue);
  if (!isInSrgbGamut(linear)) {
    let low = 0;
    let high = requestedChroma;
    for (let iteration = 0; iteration < OKLCH_GAMUT_MAP_MAX_ITERATIONS; iteration += 1) {
      const candidate = (low + high) / 2;
      const candidateLinear = oklchToLinearSrgb(l, candidate, hue);
      if (isInSrgbGamut(candidateLinear)) low = candidate;
      else high = candidate;
    }
    mappedChroma = low;
    linear = oklchToLinearSrgb(l, mappedChroma, hue);
  }
  return {
    red: clamp(linearToEncoded(clamp(linear[0], 0, 1)), 0, 1),
    green: clamp(linearToEncoded(clamp(linear[1], 0, 1)), 0, 1),
    blue: clamp(linearToEncoded(clamp(linear[2], 0, 1)), 0, 1),
    alpha: clamp(alpha, 0, 1),
  };
}

export function srgbToOklch(color: NeuSrgbColor, hueHint = 0): NeuOklchColor {
  const red = encodedToLinear(clamp(color.red, 0, 1));
  const green = encodedToLinear(clamp(color.green, 0, 1));
  const blue = encodedToLinear(clamp(color.blue, 0, 1));
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.sqrt(a * a + b * b);
  return {
    lightness: clamp(lightness, 0, 1),
    chroma,
    hue: chroma <= EPSILON ? wrapHue(hueHint) : wrapHue((Math.atan2(b, a) * 180) / Math.PI),
  };
}

function byte(channel: number): number {
  return Math.round(clamp(channel, 0, 1) * 255);
}

function hexByte(channel: number): string {
  return byte(channel).toString(16).padStart(2, '0');
}

export function serializeColor(
  color: NeuSrgbColor,
  mode: NeuColorMode,
  showAlpha: boolean,
  hueHint = 0,
): string {
  const alpha = cleanNumber(clamp(color.alpha, 0, 1), 3);
  if (mode === 'hex') {
    const rgb = `#${hexByte(color.red)}${hexByte(color.green)}${hexByte(color.blue)}`;
    return showAlpha ? `${rgb}${hexByte(color.alpha)}` : rgb;
  }
  if (mode === 'rgb') {
    const channels = `${byte(color.red)}, ${byte(color.green)}, ${byte(color.blue)}`;
    return showAlpha
      ? `rgb(${byte(color.red)} ${byte(color.green)} ${byte(color.blue)} / ${alpha})`
      : `rgb(${channels})`;
  }
  if (mode === 'hsl') {
    const hsl = srgbToHsl(color, hueHint);
    const channels = `${cleanNumber(hsl.hue, 2)}, ${cleanNumber(hsl.saturation, 2)}%, ${cleanNumber(hsl.lightness, 2)}%`;
    return showAlpha
      ? `hsl(${cleanNumber(hsl.hue, 2)} ${cleanNumber(hsl.saturation, 2)}% ${cleanNumber(hsl.lightness, 2)}% / ${alpha})`
      : `hsl(${channels})`;
  }
  const oklch = srgbToOklch(color, hueHint);
  const channels = `${cleanNumber(oklch.lightness, 6)} ${cleanNumber(oklch.chroma, 6)} ${cleanNumber(oklch.hue, 3)}`;
  return showAlpha && color.alpha < 1 ? `oklch(${channels} / ${alpha})` : `oklch(${channels})`;
}
