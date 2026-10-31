import { effect, Signal, signal } from '@angular/core';

export interface DialogViewport {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

/** A soft keyboard can shrink the visual viewport without changing dvh. */
export function observeDialogViewport(
  open: Signal<boolean>,
  document: Pick<Document, 'defaultView'>,
): Signal<DialogViewport | null> {
  const bounds = signal<DialogViewport | null>(null, {
    equal: (previous, next) =>
      previous?.top === next?.top &&
      previous?.left === next?.left &&
      previous?.width === next?.width &&
      previous?.height === next?.height,
  });

  effect((onCleanup) => {
    if (!open()) {
      bounds.set(null);
      return;
    }
    const viewport = document.defaultView?.visualViewport;
    if (!viewport) return;
    const update = () => {
      const { width, height, offsetTop, offsetLeft } = viewport;
      if (
        ![width, height, offsetTop, offsetLeft].every(Number.isFinite) ||
        width <= 0 ||
        height <= 0
      ) {
        bounds.set(null);
        return;
      }
      bounds.set({ top: Math.max(0, offsetTop), left: Math.max(0, offsetLeft), width, height });
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    onCleanup(() => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    });
  });
  return bounds.asReadonly();
}
