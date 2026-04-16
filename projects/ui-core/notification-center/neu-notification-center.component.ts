import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  OnDestroy,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';

export type NeuNotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NeuNotification {
  id: string;
  type: NeuNotificationType;
  title?: string;
  message: string;
  /** Auto-dismiss duration in ms (0 = persistent) */
  duration?: number;
  /** Icon text / emoji */
  icon?: string;
  timestamp: Date;
  read: boolean;
}

export interface NeuNotificationOptions extends Omit<
  NeuNotification,
  'id' | 'timestamp' | 'read'
> {}

const DEFAULT_ICONS: Record<NeuNotificationType, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

let _idSeq = 0;

/**
 * NeuralUI NotificationService
 *
 * Servicio inyectable que gestiona la cola de notificaciones.
 *
 * Uso:
 *   inject(NeuNotificationService).push({ type: 'success', message: '¡Guardado!' });
 */
@Injectable({ providedIn: 'root' })
export class NeuNotificationService {
  readonly notifications = signal<NeuNotification[]>([]);

  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  /** Agrega una notificación / Adds a notification */
  push(opts: Partial<NeuNotificationOptions> & Pick<NeuNotificationOptions, 'message'>): string {
    const id = `neu-notif-${++_idSeq}`;
    const n: NeuNotification = {
      id,
      type: opts.type ?? 'info',
      title: opts.title,
      message: opts.message,
      icon: opts.icon ?? DEFAULT_ICONS[opts.type ?? 'info'],
      duration: opts.duration ?? 5000,
      timestamp: new Date(),
      read: false,
    };
    this.notifications.update((list) => [n, ...list]);

    if (n.duration && n.duration > 0) {
      setTimeout(() => this.remove(id), n.duration);
    }
    return id;
  }

  /** Elimina una notificación / Removes a notification */
  remove(id: string): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  /** Marca todas como leídas / Marks all as read */
  markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  /** Elimina todas / Clears all */
  clearAll(): void {
    this.notifications.set([]);
  }
}

let _panelSeq = 0;

/**
 * NeuralUI NotificationCenter Component
 *
 * Icono de campana con badge de no leídos y panel de notificaciones
 * deslizante. Consume NeuNotificationService.
 *
 * Uso:
 *   <neu-notification-center />
 */
@Component({
  selector: 'neu-notification-center',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-nc',
    '[attr.aria-label]': '"Centro de notificaciones"',
  },
  template: `
    <!-- Bell button -->
    <button
      type="button"
      class="neu-nc__bell"
      [attr.aria-expanded]="_isOpen()"
      [attr.aria-controls]="_panelId"
      [attr.aria-label]="'Notificaciones. ' + _svc.unreadCount() + ' sin leer'"
      (click)="_toggle()"
    >
      <span class="neu-nc__bell-icon" aria-hidden="true">🔔</span>
      @if (_svc.unreadCount() > 0) {
        <span class="neu-nc__badge" aria-hidden="true">{{
          _svc.unreadCount() > 99 ? '99+' : _svc.unreadCount()
        }}</span>
      }
    </button>

    <!-- Panel -->
    @if (_isOpen()) {
      <div
        class="neu-nc__panel"
        [id]="_panelId"
        role="dialog"
        aria-modal="false"
        aria-label="Notificaciones"
      >
        <div class="neu-nc__panel-header">
          <span class="neu-nc__panel-title">Notificaciones</span>
          <div class="neu-nc__panel-actions">
            @if (_svc.unreadCount() > 0) {
              <button type="button" class="neu-nc__action-btn" (click)="_svc.markAllRead()">
                Leer todo
              </button>
            }
            @if (_svc.notifications().length > 0) {
              <button type="button" class="neu-nc__action-btn" (click)="_svc.clearAll()">
                Limpiar
              </button>
            }
          </div>
        </div>

        <div class="neu-nc__list" role="list">
          @if (!_svc.notifications().length) {
            <div class="neu-nc__empty" role="status">No hay notificaciones</div>
          }
          @for (n of _svc.notifications(); track n.id) {
            <div
              class="neu-nc__item"
              role="listitem"
              [class.neu-nc__item--unread]="!n.read"
              [class]="'neu-nc__item--' + n.type"
            >
              <span class="neu-nc__item-icon" aria-hidden="true">{{ n.icon }}</span>
              <div class="neu-nc__item-body">
                @if (n.title) {
                  <p class="neu-nc__item-title">{{ n.title }}</p>
                }
                <p class="neu-nc__item-msg">{{ n.message }}</p>
                <time class="neu-nc__item-time" [dateTime]="n.timestamp.toISOString()">
                  {{ _relativeTime(n.timestamp) }}
                </time>
              </div>
              <button
                type="button"
                class="neu-nc__item-close"
                [attr.aria-label]="'Cerrar notificación'"
                (click)="_svc.remove(n.id)"
              >
                ×
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './neu-notification-center.component.scss',
})
export class NeuNotificationCenterComponent {
  readonly _svc = inject(NeuNotificationService);
  readonly _isOpen = signal(false);
  readonly _panelId = `neu-nc-panel-${++_panelSeq}`;

  _toggle(): void {
    const opening = !this._isOpen();
    this._isOpen.set(opening);
    if (opening) {
      // Mark all as read when panel opens
      setTimeout(() => this._svc.markAllRead(), 500);
    }
  }

  _relativeTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  }
}
