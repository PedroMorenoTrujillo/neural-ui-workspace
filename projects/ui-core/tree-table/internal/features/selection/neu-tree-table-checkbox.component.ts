import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output } from '@angular/core';
import { NeuCheckboxComponent } from '@neural-ui/core/checkbox';

@Component({
  imports: [NeuCheckboxComponent],
  selector: 'neu-tree-table-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(click)': 'capture($event)',
    '[attr.data-selection-toggle-all]': 'header() ? "" : null',
    '[attr.data-selection-indicator]': 'header() ? null : ""',
  },
  styles: `:host { display: inline-flex; vertical-align: middle; }`,
  template: `
    <neu-checkbox #control [checked]="checked()" [indeterminate]="indeterminate()"
      [disabled]="disabled()" [ariaLabel]="ariaLabel()" [tabIndex]="-1"
      (checkedChange)="propose(control)" />
  `,
})
export class NeuTreeTableCheckboxComponent {
  readonly checked = input(false);
  readonly indeterminate = input(false);
  readonly disabled = input(false);
  readonly ariaLabel = input('');
  readonly header = input(false);
  readonly activate = output<MouseEvent>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private click: MouseEvent | null = null;
  private restoring = false;

  protected capture(event: MouseEvent): void {
    this.click = event;
    event.stopPropagation();
  }

  protected propose(control: NeuCheckboxComponent): void {
    if (this.restoring || this.disabled()) return;
    if (this.click) this.activate.emit(this.click);
    this.restoring = true;
    try { control.checked.set(this.checked()); } finally { this.restoring = false; }
    const native = this.element.querySelector<HTMLInputElement>('input');
    if (native) {
      native.checked = this.checked();
      native.indeterminate = this.indeterminate();
    }
  }
}
