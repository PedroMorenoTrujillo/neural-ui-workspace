import {
  Component,
  DestroyRef,
  HostListener,
  ViewEncapsulation,
  effect,
  afterRenderEffect,
  inject,
  input,
  output,
} from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuFocusTrapDirective, NeuModalFocusDirective } from '@neural-ui/core/focus-trap';
import { NeuCloseReason, NeuCloseRequest } from '@neural-ui/core/foundation';
import { InternalNeuOverlayStack } from '@neural-ui/core/internal';

export type NeuBottomSheetSize = 'sm' | 'md' | 'lg' | 'full';

@Component({
  selector: 'neu-bottom-sheet',
  imports: [NeuButtonComponent, NeuFocusTrapDirective, NeuModalFocusDirective],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-bottom-sheet-host',
    '[class.neu-bottom-sheet-host--open]': 'open()',
  },
  template: `
    @if (open()) {
      @if (backdrop()) {
        <div
          class="neu-bottom-sheet__backdrop"
          aria-hidden="true"
          (click)="requestClose('outside', $event)"
        ></div>
      }
      <section
        class="neu-bottom-sheet"
        neuFocusTrap
        neuModalFocus
        [class.neu-bottom-sheet--full]="size() === 'full'"
        [neuModalFocusInitial]="initialFocus()"
        (neuModalFocusEscape)="requestClose('escape', $event)"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="ariaLabel() || title() || 'Bottom sheet'"
      >
        <div class="neu-bottom-sheet__handle" aria-hidden="true"></div>
        @if (title()) {
          <header class="neu-bottom-sheet__header">
            <h2>{{ title() }}</h2>
            <button
              neu-button
              class="neu-bottom-sheet__close"
              type="button"
              tone="neutral" variant="ghost"
              size="sm"
              icon="lucideX"
              [iconOnly]="true"
              [ariaLabel]="closeLabel()"
              [disabled]="disableClose()"
              (click)="requestClose('action', $event)"
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
  readonly closeRequested = output<NeuCloseRequest>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlayStack = inject(InternalNeuOverlayStack);

  private eventPanelVisible = false;
  private lifecycleInitialized = false;
  /** Panel mounted in the browser, independently of the trigger source. */
  readonly opened = output<void>();
  /** Panel unmounted after an applied post-init transition. Silent on destroy. */
  readonly closed = output<void>();

  constructor() {
    afterRenderEffect(() => {
      const visible = this.open();
      if (!this.lifecycleInitialized) {
        this.lifecycleInitialized = true;
        this.eventPanelVisible = visible;
        return;
      }
      if (visible === this.eventPanelVisible) return;
      this.eventPanelVisible = visible;
      if (visible) this.opened.emit();
      else this.closed.emit();
    });
    effect((onCleanup) => {
      if (!this.open()) return;
      onCleanup(this.overlayStack.activate(this));
    });
  }

  requestClose(reason: NeuCloseReason = 'programmatic-command', originalEvent?: Event): void {
    if (
      this.disableClose() ||
      this.destroyRef.destroyed ||
      !this.open() ||
      !this.overlayStack.isTop(this)
    )
      return;
    this.closeRequested.emit({ reason, ...(originalEvent ? { originalEvent } : {}) });
  }

  @HostListener('document:keydown.escape', ['$event'])
  onDocumentEscape(event: Event): void {
    if (event.defaultPrevented || !this.open() || !this.overlayStack.isTop(this)) return;
    event.preventDefault();
    event.stopPropagation();
    this.requestClose('escape', event);
  }
}
