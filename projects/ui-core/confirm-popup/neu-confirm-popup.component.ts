import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injectable,
  ViewEncapsulation,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuFocusTrapDirective, NeuModalFocusDirective } from '@neural-ui/core/focus-trap';
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

@Component({
  selector: 'neu-confirm-popup',
  imports: [NeuButtonComponent, NeuFocusTrapDirective, NeuModalFocusDirective],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-confirm-popup-host' },
  template: `
    @if (open() || service.state()) {
      <div
        class="neu-confirm-popup"
        role="alertdialog"
        aria-modal="false"
        neuFocusTrap
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
          <button neu-button type="button" class="neu-confirm-popup__reject" variant="secondary" size="sm" (click)="reject()">
            {{ currentRejectLabel() }}
          </button>
          <button neu-button type="button" class="neu-confirm-popup__accept" variant="primary" size="sm" (click)="accept()">
            {{ currentAcceptLabel() }}
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './neu-confirm-popup.component.scss',
})
export class NeuConfirmPopupComponent {
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
    inject(DestroyRef).onDestroy(() => {
      if (this.service.state()) this.service.close(false);
    });
  }

  currentTitle(): string {
    return this.service.state()?.title ?? this.title();
  }

  currentMessage(): string {
    return this.service.state()?.message ?? this.message();
  }

  currentAcceptLabel(): string {
    return this.service.state()?.acceptLabel ?? this.acceptLabel();
  }

  currentRejectLabel(): string {
    return this.service.state()?.rejectLabel ?? this.rejectLabel();
  }

  accept(): void {
    this.accepted.emit();
    this.service.close(true);
  }

  reject(): void {
    this.rejected.emit();
    this.service.close(false);
  }
}
