import { effect, Signal, signal } from '@angular/core';

/** A soft keyboard can shrink the visual viewport without changing dvh. */
export function observeDialogViewport(
  open: Signal<boolean>,
  document: Pick<Document, 'defaultView'>,
): Signal<string> {
  const bounds = signal('');

  effect((onCleanup) => {
    if (!open()) {
      bounds.set('');
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
        bounds.set('');
        return;
      }
      bounds.set(
        `inset:${Math.max(0, offsetTop)}px auto auto ${Math.max(0, offsetLeft)}px;width:${width}px;height:${height}px`,
      );
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
