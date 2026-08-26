import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuFocusTrapDirective, NeuModalFocusDirective } from '@neural-ui/core/focus-trap';

export type NeuBottomSheetSize = 'sm' | 'md' | 'lg' | 'full';

@Component({
  selector: 'neu-bottom-sheet',
  imports: [NeuButtonComponent, NeuFocusTrapDirective, NeuModalFocusDirective],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-bottom-sheet-host',
    '[class.neu-bottom-sheet-host--open]': 'open()',
  },
  template: `
    @if (open()) {
      @if (backdrop()) {
        <div class="neu-bottom-sheet__backdrop" aria-hidden="true" (click)="requestClose()"></div>
      }
      <section
        class="neu-bottom-sheet"
        neuFocusTrap
        neuModalFocus
        [class.neu-bottom-sheet--full]="size() === 'full'"
        [neuModalFocusInitial]="initialFocus()"
        (neuModalFocusEscape)="requestClose()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="ariaLabel() || title()"
      >
        <div class="neu-bottom-sheet__handle" aria-hidden="true"></div>
        @if (title()) {
          <header class="neu-bottom-sheet__header">
            <h2>{{ title() }}</h2>
            <button
              neu-button
              class="neu-bottom-sheet__close"
              type="button"
              variant="ghost"
              size="sm"
              icon="lucideX"
              [iconOnly]="true"
              [ariaLabel]="closeLabel()"
              [disabled]="disableClose()"
              (click)="requestClose()"
            ></button>
          </header>
        }
        <div class="neu-bottom-sheet__body"><ng-content /></div>
      </section>
    }
  `,
  styleUrl: './neu-bottom-sheet.component.scss',
})
export class NeuBottomSheetComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly ariaLabel = input('');
  readonly closeLabel = input('Close');
  readonly backdrop = input(true);
  readonly disableClose = input(false);
  readonly size = input<NeuBottomSheetSize>('md');
  readonly initialFocus = input('first');
  readonly closed = output<void>();

  requestClose(): void {
    if (!this.disableClose()) {
      this.closed.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    if (this.open()) this.requestClose();
  }
}
