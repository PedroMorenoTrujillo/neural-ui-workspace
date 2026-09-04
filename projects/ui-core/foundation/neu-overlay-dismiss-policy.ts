import { InjectionToken, type Provider } from '@angular/core';

export type NeuOverlayDismissReason =
  | 'escape'
  | 'outside-pointer'
  | 'backdrop'
  | 'focus-loss';

export type NeuOverlaySource =
  | 'dialog'
  | 'popover'
  | 'menu'
  | 'context-menu'
  | 'select'
  | 'multiselect'
  | 'tree-select'
  | 'cascade-select'
  | 'color-picker';

export interface NeuOverlayDismissContext {
  readonly source: NeuOverlaySource;
  readonly reason: NeuOverlayDismissReason;
  readonly originalEvent: Event | null;
}

/** Return `false` to keep the overlay open. Guards are intentionally synchronous. */
export type NeuOverlayDismissGuard = (context: NeuOverlayDismissContext) => boolean;

export const NEU_OVERLAY_DISMISS_GUARD = new InjectionToken<NeuOverlayDismissGuard>(
  'NEU_OVERLAY_DISMISS_GUARD',
);

export function provideNeuOverlayDismissGuard(guard: NeuOverlayDismissGuard): Provider {
  return { provide: NEU_OVERLAY_DISMISS_GUARD, useValue: guard };
}

/** Exceptions fail closed so application policy cannot accidentally tear down an overlay. */
export function allowsNeuOverlayDismissal(
  guard: NeuOverlayDismissGuard | null,
  context: NeuOverlayDismissContext,
): boolean {
  if (!guard) return true;
  try {
    return guard(context) !== false;
  } catch {
    return false;
  }
}
