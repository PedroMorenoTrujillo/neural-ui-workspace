import { isPlatformServer } from '@angular/common';
import { Component, ElementRef, inject, input, makeStateKey, output, PLATFORM_ID, TransferState } from '@angular/core';
import { NeuCheckboxComponent } from '@neural-ui/core/checkbox';

const serverCheckbox = makeStateKey<boolean>('neu-table-checkbox-ssr');

/** Selection is a proposal, not an editable local model. The renderer handles activation. */
@Component({
  selector: 'neu-table-checkbox',
  imports: [NeuCheckboxComponent],
  host: { '(click)': 'capture($event)' },
  template: `
    @if (hydrate) {
      @defer (on immediate; hydrate on immediate) {
        <neu-checkbox #control [checked]="checked()" [indeterminate]="indeterminate()"
          [disabled]="disabled()" [ariaLabel]="ariaLabel()" (checkedChange)="propose(control)" />
      }
    } @else {
      @defer (on immediate) {
        <neu-checkbox #control [checked]="checked()" [indeterminate]="indeterminate()"
          [disabled]="disabled()" [ariaLabel]="ariaLabel()" (checkedChange)="propose(control)" />
      }
    }
  `,
  styles: ':host { display: inline-flex; vertical-align: middle; }',
})
export class NeuTableCheckboxComponent {
  readonly checked = input(false);
  readonly indeterminate = input(false);
  readonly disabled = input(false);
  readonly ariaLabel = input.required<string>();
  readonly activate = output<MouseEvent>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private click: MouseEvent | null = null;
  private restoring = false;
  protected capture(event: MouseEvent): void {
    this.click = event;
    event.stopPropagation();
  }
  protected propose(control: NeuCheckboxComponent): void {
    if (this.restoring) return;
    if (this.click) this.activate.emit(this.click);
    this.restoring = true;
    try { control.checked.set(this.checked()); } finally { this.restoring = false; }
    // Keep rejected proposals controlled, including same-turn native changes.
    const native = this.element.querySelector<HTMLInputElement>('input');
    if (native) native.checked = this.checked();
  }
  protected readonly hydrate: boolean;

  constructor() {
    const state = inject(TransferState);
    if (isPlatformServer(inject(PLATFORM_ID))) state.set(serverCheckbox, true);
    this.hydrate = state.get(serverCheckbox, false);
  }
}
