/** Browser-only resize observation with a single coalesced measurement pass. */
export class NeuTableViewportController {
  private _observer: ResizeObserver | null = null;
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _windowCleanup: (() => void) | null = null;

  observe(view: Window, elements: readonly Element[], delay: number, measure: () => void): void {
    this.disconnect();
    const schedule = () => {
      if (this._timer !== null) clearTimeout(this._timer);
      const normalized = Number.isFinite(delay) ? Math.max(0, Math.floor(delay)) : 0;
      if (normalized === 0) {
        measure();
        return;
      }
      this._timer = setTimeout(() => {
        this._timer = null;
        measure();
      }, normalized);
    };
    const ResizeObserverConstructor = (
      view as unknown as {
        ResizeObserver?: typeof ResizeObserver;
      }
    ).ResizeObserver;
    if (typeof ResizeObserverConstructor === 'function') {
      const observer = new ResizeObserverConstructor(schedule);
      this._observer = observer;
      for (const element of elements) observer.observe(element);
    } else {
      view.addEventListener('resize', schedule, { passive: true });
      this._windowCleanup = () => view.removeEventListener('resize', schedule);
    }
    schedule();
  }

  disconnect(): void {
    this._observer?.disconnect();
    this._observer = null;
    this._windowCleanup?.();
    this._windowCleanup = null;
    if (this._timer !== null) clearTimeout(this._timer);
    this._timer = null;
  }
}
