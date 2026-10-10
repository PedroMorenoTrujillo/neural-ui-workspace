export type SliderRange = readonly [number, number];
export type SliderValue = number | SliderRange;
export type SliderThumb = 0 | 1;

export function isSliderRange(value: SliderValue): value is SliderRange {
  return Array.isArray(value);
}

export function sliderClamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function precisionOf(value: number): number {
  const text = value.toString().toLowerCase();
  if (text.includes('e-')) return Math.min(12, Number(text.split('e-')[1]));
  return Math.min(12, text.includes('.') ? text.length - text.indexOf('.') - 1 : 0);
}

export function sliderSnap(value: number, min: number, step: number): number {
  const places = Math.max(precisionOf(min), precisionOf(step));
  return Number((min + Math.round((value - min) / step) * step).toFixed(places));
}

export function sliderVisualRange(
  value: SliderRange,
  min: number,
  max: number,
  gap: number,
): SliderRange {
  const lower = Number.isFinite(value[0]) ? sliderClamp(value[0], min, max) : min;
  const upper = Number.isFinite(value[1]) ? sliderClamp(value[1], min, max) : max;
  const orderedLower = Math.min(lower, upper);
  const orderedUpper = Math.max(lower, upper);
  const effectiveGap = Math.min(Math.max(0, gap), max - min);
  return [
    Math.min(orderedLower, max - effectiveGap),
    Math.max(orderedUpper, Math.min(max, orderedLower + effectiveGap)),
  ];
}

export function sliderCommitRange(
  current: SliderRange,
  thumb: SliderThumb,
  candidate: number,
  min: number,
  max: number,
  step: number,
  gap: number,
): SliderRange {
  const derived = sliderVisualRange(current, min, max, gap);
  const visual = sliderVisualRange(
    [
      sliderClamp(sliderSnap(derived[0], min, step), min, max),
      sliderClamp(sliderSnap(derived[1], min, step), min, max),
    ],
    min,
    max,
    gap,
  );
  const effectiveGap = Math.min(Math.max(0, gap), max - min);
  const lowerLimit = thumb === 0 ? min : visual[0] + effectiveGap;
  const upperLimit = thumb === 0 ? visual[1] - effectiveGap : max;
  const lowerStep = Math.ceil((lowerLimit - min) / step - 1e-10);
  const upperStep = Math.floor((upperLimit - min) / step + 1e-10);
  const snapped = lowerStep <= upperStep
    ? sliderSnap(
      min + sliderClamp(Math.round((candidate - min) / step), lowerStep, upperStep) * step,
      min,
      step,
    )
    : sliderClamp(sliderSnap(candidate, min, step), lowerLimit, upperLimit);
  return thumb === 0 ? [snapped, visual[1]] : [visual[0], snapped];
}
