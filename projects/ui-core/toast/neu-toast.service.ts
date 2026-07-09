import { Injectable, signal } from '@angular/core';
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
  /** Lista reactiva de toasts activos / Reactive list of active toasts */
  readonly toasts = signal<NeuToastItem[]>([]);

  /** Posición del contenedor de toasts / Toast container position */
  readonly position = signal<NeuToastPosition>('top-right');

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  setPosition(position: NeuToastPosition): void {
    this.position.set(position);
  }

  show(options: NeuToastOptions): string {
    const id = `neu-toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = options.duration ?? 4000;

    const item: NeuToastItem = {
      id,
      message: options.message,
      title: options.title ?? '',
      type: options.type ?? 'info',
      duration,
    };

    this.toasts.update((list) => [...list, item]);

    if (duration > 0) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  success(message: string, opts?: Partial<NeuToastOptions>): string {
    return this.show({ ...opts, message, type: 'success' });
  }

  error(message: string, opts?: Partial<NeuToastOptions>): string {
    return this.show({ ...opts, message, type: 'error' });
  }

  info(message: string, opts?: Partial<NeuToastOptions>): string {
    return this.show({ ...opts, message, type: 'info' });
  }

  warning(message: string, opts?: Partial<NeuToastOptions>): string {
    return this.show({ ...opts, message, type: 'warning' });
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
