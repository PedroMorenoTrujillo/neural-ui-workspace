import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  Injectable,
  PLATFORM_ID,
  ViewEncapsulation,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ConnectedPosition, Overlay, OverlayModule } from '@angular/cdk/overlay';
import { InternalNeuIconOutletComponent, neuStructuralIconPath, neuSemanticIconText } from '@neural-ui/core/icon-outlet-internal';
import type { NeuIconKey } from '@neural-ui/core/foundation';
import { neuIconBell as iconBell } from '@neural-ui/core/internal';
import { neuIconCircleCheck as iconCircleCheck } from '@neural-ui/core/internal';
import { neuIconCircleX as iconCircleX } from '@neural-ui/core/internal';
import { neuIconInfo as iconInfo } from '@neural-ui/core/internal';
import { neuIconWarning as iconWarning } from '@neural-ui/core/internal';
import { neuIconX as iconX } from '@neural-ui/core/internal';
import { NeuIdGenerator, NeuInitialTemporalState } from '@neural-ui/core/internal';

export type NeuNotificationTone = 'info' | 'success' | 'warning' | 'danger';

export interface NeuNotification {
  id: string;
  tone: NeuNotificationTone;
  title?: string;
  message: string;
  /** Auto-dismiss duration in ms (0 = persistent) */
  duration?: number;
  /** Optional consumer-registered neural icon name. */
  icon?: NeuIconKey;
  timestamp: Date;
  read: boolean;
}

export interface NeuNotificationOptions extends Omit<
  NeuNotification,
  'id' | 'timestamp' | 'read'
> {}

const DEFAULT_ICONS: Record<NeuNotificationTone, NeuIconKey> = {
  info: iconInfo,
  success: iconCircleCheck,
  warning: iconWarning,
  danger: iconCircleX,
};

/**
 * NeuralUI NotificationService
 *
 * Servicio inyectable que gestiona la cola de notificaciones.
 *
 * Uso:
 *   inject(NeuNotificationService).push({ tone: 'success', message: '¡Guardado!' });
 */
@Injectable({ providedIn: 'root' })
export class NeuNotificationService {
  private readonly ids = inject(NeuIdGenerator);
  private readonly temporal = inject(NeuInitialTemporalState);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Lista reactiva de notificaciones, con la más reciente primero / Reactive notification list, newest first */
  readonly notifications = signal<NeuNotification[]>([]);

  /** Número de notificaciones sin leer / Number of unread notifications */
  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearAll());
  }

  /** Agrega una notificación / Adds a notification */
  push(opts: Partial<NeuNotificationOptions> & Pick<NeuNotificationOptions, 'message'>): string {
    const id = this.ids.getId('neu-notif-');
    const n: NeuNotification = {
      id,
      tone: opts.tone ?? 'info',
      title: opts.title,
      message: opts.message,
      icon: opts.icon,
      duration: opts.duration ?? 5000,
      timestamp: this.temporal.currentNow(),
      read: false,
    };
    this.notifications.update((list) => [n, ...list]);

    if (this.browser && n.duration && n.duration > 0) {
      const timer = setTimeout(() => this.remove(id), n.duration);
      this.timers.set(id, timer);
    }
    return id;
  }

  /** Elimina una notificación / Removes a notification */
  remove(id: string): void {
    this.clearTimer(id);
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  /** Marca todas como leídas / Marks all as read */
  markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  /** Elimina todas / Clears all */
  clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.notifications.set([]);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return;
    clearTimeout(timer);
    this.timers.delete(id);
  }
}

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
  imports: [OverlayModule, InternalNeuIconOutletComponent],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-nc',
    '[attr.aria-label]': '"Centro de notificaciones"',
  },
  template: `
    <!-- Bell button -->
    <button
      #bell
      cdkOverlayOrigin
      #notificationOrigin="cdkOverlayOrigin"
      type="button"
      class="neu-nc__bell"
      [attr.aria-expanded]="_isOpen()"
      [attr.aria-controls]="_panelId"
      [attr.aria-label]="'Notificaciones. ' + _svc.unreadCount() + ' sin leer'"
      (click)="_toggle()"
    >
      <neu-icon-outlet class="neu-nc__bell-icon" [icon]="iconBell" [fallbackPath]="iconFallbackPath(iconBell)" [fallbackText]="iconFallbackText(iconBell)" size="1.2rem" aria-hidden="true" />
      @if (_svc.unreadCount() > 0) {
        <span class="neu-nc__badge" aria-hidden="true">{{
          _svc.unreadCount() > 99 ? '99+' : _svc.unreadCount()
        }}</span>
      }
    </button>

    <!-- Panel -->
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="notificationOrigin"
      [cdkConnectedOverlayOpen]="_isOpen()"
      [cdkConnectedOverlayPositions]="overlayPositions"
      [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="_viewportMargin"
      (attach)="_onOverlayAttach()"
      (backdropClick)="_close()"
      (detach)="_onOverlayDetach()"
      (overlayKeydown)="_onOverlayKeydown($event)"
    >
      <div
        #panel
        class="neu-nc__panel"
        [id]="_panelId"
        role="dialog"
        aria-modal="false"
        aria-label="Notificaciones"
        tabindex="-1"
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
              [class]="'neu-nc__item--' + n.tone"
            >
              <span class="neu-nc__item-icon" aria-hidden="true">
                <neu-icon-outlet [icon]="n.icon ?? defaultIcon(n.tone)" [fallbackPath]="iconFallbackPath(n.icon ?? defaultIcon(n.tone))" [fallbackText]="iconFallbackText(n.icon ?? defaultIcon(n.tone))" size="1rem" />
              </span>
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
                [attr.aria-label]="'Cerrar notificación: ' + (n.title ?? n.message)"
                (click)="_svc.remove(n.id)"
              >
                <neu-icon-outlet [icon]="iconX" [fallbackPath]="iconFallbackPath(iconX)" [fallbackText]="iconFallbackText(iconX)" size="1rem" aria-hidden="true" />
              </button>
            </div>
          }
        </div>
      </div>
    </ng-template>
  `,
  styleUrl: './neu-notification-center.component.scss',
})
export class NeuNotificationCenterComponent {
  protected readonly iconFallbackPath = neuStructuralIconPath;
  protected readonly iconFallbackText = neuSemanticIconText;
  protected readonly iconBell = iconBell;
  protected readonly iconX = iconX;
  protected readonly _svc = inject(NeuNotificationService);
  private readonly overlay = inject(Overlay);
  private readonly temporal = inject(NeuInitialTemporalState);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bellRef = viewChild<ElementRef<HTMLButtonElement>>('bell');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private pendingMarkReadTimer: ReturnType<typeof setTimeout> | null = null;
  protected readonly _isOpen = signal(false);
  protected readonly _panelId = inject(NeuIdGenerator).getId('neu-nc-panel-');
  protected readonly _viewportMargin = 16;
  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 8,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -8,
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 8,
    },
  ];
  readonly overlayScrollStrategy = this.overlay.scrollStrategies.reposition();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.cancelPendingMarkRead();
      this._isOpen.set(false);
    });
  }

  protected _toggle(): void {
    if (this._isOpen()) {
      this._close();
    } else {
      this._isOpen.set(true);
      this.scheduleMarkAllRead();
    }
  }

  protected _close(restoreFocus = true): void {
    if (!this._isOpen()) return;
    this._isOpen.set(false);
    this.cancelPendingMarkRead();
    if (!restoreFocus) return;
    queueMicrotask(() => {
      const bell = this.bellRef()?.nativeElement;
      if (!this.destroyRef.destroyed && bell?.isConnected) {
        bell.focus({ preventScroll: true });
      }
    });
  }

  protected _onOverlayAttach(): void {
    queueMicrotask(() => {
      const panel = this.panelRef()?.nativeElement;
      if (this._isOpen() && !this.destroyRef.destroyed && panel?.isConnected) {
        const firstAction = panel.querySelector<HTMLElement>('button:not([disabled])');
        (firstAction ?? panel).focus({ preventScroll: true });
      }
    });
  }

  protected _onOverlayDetach(): void {
    if (this._isOpen()) this._close();
  }

  protected _onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this._isOpen()) return;
    event.preventDefault();
    event.stopPropagation();
    this._close();
  }

  private scheduleMarkAllRead(): void {
    this.cancelPendingMarkRead();
    this.pendingMarkReadTimer = setTimeout(() => {
      this.pendingMarkReadTimer = null;
      if (!this.destroyRef.destroyed) this._svc.markAllRead();
    }, 500);
  }

  private cancelPendingMarkRead(): void {
    if (this.pendingMarkReadTimer === null) return;
    clearTimeout(this.pendingMarkReadTimer);
    this.pendingMarkReadTimer = null;
  }

  protected _relativeTime(date: Date): string {
    const diff = this.temporal.currentNow().getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  }

  protected defaultIcon(tone: NeuNotificationTone): NeuIconKey {
    return DEFAULT_ICONS[tone];
  }
}
