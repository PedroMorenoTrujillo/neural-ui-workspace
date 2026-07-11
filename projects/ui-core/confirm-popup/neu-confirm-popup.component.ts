import { Injectable, signal, ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core/button';

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
    this.state.set(options);
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  close(value: boolean): void {
    this.state.set(null);
    this.resolver?.(value);
    this.resolver = null;
  }
}

@Component({
  selector: 'neu-confirm-popup',
  imports: [NeuButtonComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-confirm-popup-host' },
  template: `
    @if (open() || service.state()) {
      <div class="neu-confirm-popup" role="alertdialog" aria-modal="false">
        @if (currentTitle()) {
          <h3>{{ currentTitle() }}</h3>
        }
        <p>{{ currentMessage() }}</p>
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

  constructor(readonly service: NeuConfirmPopupService) {}

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
