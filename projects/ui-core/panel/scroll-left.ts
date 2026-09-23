/** Browser-specific RTL scrollLeft modes; never part of the public ScrollArea API. */
export type RtlScrollMode = 'negative' | 'reverse' | 'default';

export function clampScroll(value: number, max: number): number {
  return Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0));
}

export function rawScrollLeftToLogical(
  raw: number, max: number, rtl: boolean, mode: RtlScrollMode,
): number {
  if (!rtl) return clampScroll(raw, max);
  return clampScroll(mode === 'negative' ? -raw : mode === 'default' ? max - raw : raw, max);
}

export function logicalScrollLeftToRaw(
  logical: number, max: number, rtl: boolean, mode: RtlScrollMode,
): number {
  const position = clampScroll(logical, max);
  if (!rtl) return position;
  return mode === 'negative' ? (position === 0 ? 0 : -position)
    : mode === 'default' ? max - position : position;
}

/** Called only after a browser render; the probe is removed synchronously. */
export function detectRtlScrollMode(document: Document): RtlScrollMode {
  const probe = document.createElement('div');
  const content = document.createElement('div');
  probe.dir = 'rtl';
  probe.style.cssText = 'position:absolute;visibility:hidden;overflow:scroll;width:4px;height:4px;';
  content.style.width = '8px';
  probe.appendChild(content);
  document.body.appendChild(probe);
  try {
    if (probe.scrollLeft > 0) return 'default';
    probe.scrollLeft = 1;
    return probe.scrollLeft === 0 ? 'negative' : 'reverse';
  } finally {
    probe.remove();
  }
}
