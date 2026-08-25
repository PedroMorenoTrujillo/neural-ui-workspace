import { Directive, input } from '@angular/core';

/** Marks an interactive element as the drag origin for its enclosing NeuTable row. */
@Directive({
  selector: '[neuTableRowReorderHandle]',
  host: {
    class: 'neu-table__row-reorder-handle',
    '[attr.data-neu-table-row-reorder-handle]': 'disabled() ? null : "true"',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export class NeuTableRowReorderHandleDirective {
  readonly disabled = input(false, { alias: 'neuTableRowReorderHandleDisabled' });
}
