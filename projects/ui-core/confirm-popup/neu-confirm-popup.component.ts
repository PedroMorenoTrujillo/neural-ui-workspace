import {
  Component,
  DestroyRef,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuModalFocusDirective } from '@neural-ui/core/focus-trap';
import { NeuIdGenerator } from '@neural-ui/core/internal';

export interface NeuConfirmPopupOptions {
  title?: string;
  message: string;
  acceptLabel?: string;
  rejectLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class NeuConfirmPopupService {
  readonly state = signal<NeuConfirmPopupOptions | null>(null);
  private resolver: ((value: boolean) => void) | null = null;

  confirm(options: NeuConfirmPopupOptions): Promise<boolean> {
    // A newer confirmation supersedes the previous one. Resolve the previous
    // promise instead of leaving a caller suspended forever.
    this.resolvePending(false);
    this.state.set(options);
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  close(value: boolean): void {
    this.state.set(null);
    this.resolvePending(value);
  }

  private resolvePending(value: boolean): void {
    const resolve = this.resolver;
    this.resolver = null;
    resolve?.(value);
  }
}

/** Routes one service-owned confirmation to one mounted host per injector. */
@Injectable({ providedIn: 'root' })
class ConfirmPopupHostRegistry {
  private nextId = 0;
  private readonly hosts: number[] = [];
  private readonly owner = signal<number | null>(null);
  readonly active = this.owner.asReadonly();

  register(): number {
    const id = ++this.nextId;
    this.hosts.push(id);
    if (this.owner() === null) this.owner.set(id);
    return id;
  }

  unregister(id: number): boolean {
    const index = this.hosts.indexOf(id);
    if (index !== -1) this.hosts.splice(index, 1);
    if (this.owner() === id) this.owner.set(this.hosts[0] ?? null);
    return this.hosts.length === 0;
  }
}

@Component({
  selector: 'neu-confirm-popup',
  imports: [NeuButtonComponent, NeuModalFocusDirective],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-confirm-popup-host',
    '(window:resize)': 'fitToViewport()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    @if (open() || serviceSession()) {
      <div
        #panel
        class="neu-confirm-popup"
        role="alertdialog"
        aria-modal="false"
        neuModalFocus
        [neuModalFocusInitial]="'.neu-confirm-popup__reject'"
        [attr.aria-labelledby]="currentTitle() ? titleId : null"
        [attr.aria-describedby]="messageId"
        (neuModalFocusEscape)="reject()"
      >
        @if (currentTitle()) {
          <h3 [id]="titleId">{{ currentTitle() }}</h3>
        }
        <p [id]="messageId">{{ currentMessage() }}</p>
        <div class="neu-confirm-popup__actions">
          <button
            neu-button
            type="button"
            class="neu-confirm-popup__reject"
            tone="neutral"
            variant="solid"
            size="sm"
            (click)="reject()"
          >
            {{ currentRejectLabel() }}
          </button>
          <button
            neu-button
            type="button"
            class="neu-confirm-popup__accept"
            tone="brand"
            variant="solid"
            size="sm"
            (click)="accept()"
          >
            {{ currentAcceptLabel() }}
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './neu-confirm-popup.component.scss',
})
export class NeuConfirmPopupComponent {
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly registry = inject(ConfirmPopupHostRegistry);
  private readonly hostId: number;
  protected readonly serviceSession = computed(() =>
    this.registry.active() === this.hostId ? this.service.state() : null,
  );
  readonly open = input(false);
  readonly title = input('');
  readonly message = input('');
  readonly acceptLabel = input('Confirm');
  readonly rejectLabel = input('Cancel');
  readonly accepted = output<void>();
  readonly rejected = output<void>();
  protected readonly titleId = inject(NeuIdGenerator).getId('neu-confirm-popup-title-');
  protected readonly messageId = inject(NeuIdGenerator).getId('neu-confirm-popup-message-');

  constructor(readonly service: NeuConfirmPopupService) {
    this.hostId = this.registry.register();
    afterRenderEffect(() => {
      this.panel();
      this.serviceSession();
      this.title();
      this.message();
      this.fitToViewport();
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.registry.unregister(this.hostId) && this.service.state()) this.service.close(false);
    });
  }

  protected fitToViewport(): void {
    const panel = this.panel()?.nativeElement;
    const viewport = panel?.ownerDocument.defaultView;
    if (!panel || !viewport) return;
    // Measure from the anchor again so resizing never accumulates offsets.
    panel.style.transform = '';
    const bounds = panel.getBoundingClientRect();
    const x = Math.max(16 - bounds.left, Math.min(0, viewport.innerWidth - 16 - bounds.right));
    const y = Math.max(16 - bounds.top, Math.min(0, viewport.innerHeight - 16 - bounds.bottom));
    panel.style.transform = `translate(${x}px, ${y}px)`;
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    const panel = this.panel()?.nativeElement;
    if (panel && event.target && !panel.contains(event.target as Node)) this.reject();
  }

  currentTitle(): string {
    return this.serviceSession()?.title ?? this.title();
  }

  currentMessage(): string {
    return this.serviceSession()?.message ?? this.message();
  }

  currentAcceptLabel(): string {
    return this.serviceSession()?.acceptLabel ?? this.acceptLabel();
  }

  currentRejectLabel(): string {
    return this.serviceSession()?.rejectLabel ?? this.rejectLabel();
  }

  accept(): void {
    this.accepted.emit();
    if (this.serviceSession()) this.service.close(true);
  }

  reject(): void {
    this.rejected.emit();
    if (this.serviceSession()) this.service.close(false);
  }
}
