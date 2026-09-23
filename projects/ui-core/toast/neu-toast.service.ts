import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { NeuToastItem, NeuToastOptions, NeuToastPosition } from './neu-toast.types';

/**
 * NeuralUI Toast Service
 *
 * Lanza notificaciones flotantes desde cualquier punto de la app.
 * Requiere que `<neu-toast-container>` esté presente en la raíz del app.
 *
 * Uso:
 *   const toast = inject(NeuToastService);
 *   toast.success('Guardado correctamente');
 *   toast.error('Ha ocurrido un error', { title: 'Error', duration: 8000 });
 */
@Injectable({ providedIn: 'root' })
export class NeuToastService {
  private readonly ids = inject(NeuIdGenerator);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /** Lista reactiva de toasts activos / Reactive list of active toasts */
  readonly toasts = signal<NeuToastItem[]>([]);

  /** Posición del contenedor de toasts / Toast container position */
  readonly position = signal<NeuToastPosition>('top-right');

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }

  setPosition(position: NeuToastPosition): void {
    this.position.set(position);
  }

  show(options: NeuToastOptions): string {
    const id = this.ids.getId('neu-toast-');
    const duration = options.duration ?? 4000;

    const item: NeuToastItem = {
      id,
      message: options.message,
      title: options.title ?? '',
      tone: options.tone ?? 'info',
      duration,
    };

    this.toasts.update((list) => [...list, item]);

    if (this.isBrowser && duration > 0) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  success(message: string, opts?: Partial<NeuToastOptions>): string {
    return this.show({ ...opts, message, tone: 'success' });
  }

  error(message: string, opts?: Partial<NeuToastOptions>): string {
    return this.show({ ...opts, message, tone: 'danger' });
  }

  info(message: string, opts?: Partial<NeuToastOptions>): string {
    return this.show({ ...opts, message, tone: 'info' });
  }

  warning(message: string, opts?: Partial<NeuToastOptions>): string {
    return this.show({ ...opts, message, tone: 'warning' });
  }

  dismiss(id: string): void {
    this.clearTimer(id);
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.toasts.set([]);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return;
    clearTimeout(timer);
    this.timers.delete(id);
  }
}
