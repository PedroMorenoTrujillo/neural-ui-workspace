import { afterNextRender, Component, ElementRef, inject, input } from '@angular/core';
import type {
  NeuFilterConstraint,
  NeuTableColumnOptions,
  NeuTableLabels,
  NeuTableMessage,
  NeuTablePaginationOptions,
  NeuTablePaginatorContext,
} from '../../../public/neu-table.types';
import { tableMessage } from '../../semantics/neu-table-labels';

export interface TableFilterControls {
  readonly column: string;
  readonly menu: boolean;
  readonly rule: NeuFilterConstraint<string>['rule'];
  readonly rules: readonly NeuFilterConstraint<string>['rule'][];
  readonly value: string;
  readonly needsValue: boolean;
  readonly explicit: boolean;
  readonly canClear: boolean;
  readonly setRule: (event: Event) => void;
  readonly setValue: (event: Event) => void;
  readonly apply: (event?: Event) => void;
  readonly clear: () => void;
  readonly cancel: () => void;
}

export type TableColumnAction =
  | 'filter'
  | 'left'
  | 'right'
  | 'pin'
  | 'hide'
  | 'resizeStart'
  | 'resizeMove'
  | 'resizeCommit'
  | 'resizeCancel'
  | 'resizeLeft'
  | 'resizeRight';
export interface TableColumnControls {
  readonly id: string;
  readonly name: string;
  readonly options: NeuTableColumnOptions;
  readonly filter: boolean;
  readonly open: boolean;
  readonly filtered: boolean;
  readonly action: (action: TableColumnAction, event: Event) => void;
}

export interface TableSearchControls {
  readonly value: string;
  readonly begin: () => void;
  readonly update: (event: Event) => void;
  readonly cancel: (event: Event) => void;
  readonly commit: (event: Event) => void;
  readonly clear: (event: Event) => void;
}

export interface TableQueryControls {
  readonly pagination?: NeuTablePaginatorContext;
  readonly options?: NeuTablePaginationOptions;
  readonly report?: string;
  readonly filter?: TableFilterControls;
  readonly column?: TableColumnControls;
  readonly search?: TableSearchControls;
  readonly messages?: NeuTableLabels['messages'];
}

/** Optional query UI. Kept out of the basic Table's initial dependency closure. */
@Component({
  selector: 'neu-table-query-controls',
  host: { '[class.pagination]': '!!controls().pagination' },
  template: `
    @let config = controls();
    @if (config.search; as state) {
      <form class="neu-table2__search" role="search" (submit)="state.commit($event)">
        <label
          ><span class="neu-table2__visually-hidden">{{ text('searchTable') }}</span>
          <input
            type="search"
            [attr.aria-label]="text('searchTable')"
            [value]="state.value"
            (focus)="state.begin()"
            (input)="state.update($event)"
            (keydown.escape)="state.cancel($event)"
          />
        </label>
        <button type="submit">{{ text('search') }}</button>
        <button type="button" [attr.aria-label]="text('clearSearch')" (click)="state.clear($event)">
          {{ text('clear') }}
        </button>
      </form>
    }
    @if (config.column; as state) {
      <span class="neu-table2__column-actions" data-neu-selection-stop>
        @if (state.filter) {
          <button
            type="button"
            aria-haspopup="dialog"
            [attr.aria-expanded]="state.open"
            [attr.aria-pressed]="state.filtered"
            [attr.aria-label]="text('filterColumn', state.name)"
            (click)="state.action('filter', $event)"
          >
            {{ text('filter') }}
          </button>
        }
        @if (state.options.reorderable) {
          <button
            type="button"
            [attr.data-layout-focus]="'move:' + state.id + ':-1'"
            [attr.aria-label]="text('moveLeft', state.name)"
            (click)="state.action('left', $event)"
          >
            ←
          </button>
          <button
            type="button"
            [attr.data-layout-focus]="'move:' + state.id + ':1'"
            [attr.aria-label]="text('moveRight', state.name)"
            (click)="state.action('right', $event)"
          >
            →
          </button>
        }
        @if (state.options.pinnable) {
          <button
            type="button"
            [attr.aria-label]="text('pinColumn', state.name)"
            (click)="state.action('pin', $event)"
          >
            {{ text('pin') }}
          </button>
        }
        @if (state.options.hideable) {
          <button
            type="button"
            [attr.aria-label]="text('hideColumn', state.name)"
            (click)="state.action('hide', $event)"
          >
            {{ text('hide') }}
          </button>
        }
      </span>
      @if (state.options.resizable) {
        <button
          type="button"
          class="neu-table2__resize-handle"
          [attr.aria-label]="text('resizeColumn', state.name)"
          (pointerdown)="state.action('resizeStart', $event)"
          (pointermove)="state.action('resizeMove', $event)"
          (pointerup)="state.action('resizeCommit', $event)"
          (pointercancel)="state.action('resizeCancel', $event)"
          (keydown.arrowleft)="state.action('resizeLeft', $event)"
          (keydown.arrowright)="state.action('resizeRight', $event)"
          (keydown.escape)="state.action('resizeCancel', $event)"
        >
          <span aria-hidden="true">↔</span>
        </button>
      }
    }
    @if (config.pagination; as state) {
      <button
        type="button"
        [attr.aria-label]="text('firstPage')"
        [disabled]="!state.canFirst"
        (click)="state.changePage(0)"
      >
        «
      </button>
      <button
        type="button"
        [attr.aria-label]="text('previousPage')"
        [disabled]="!state.canPrevious"
        (click)="state.changePage(state.page - 1)"
      >
        ‹
      </button>
      <span aria-current="page"
        >{{ text('page') }} {{ state.humanPage }}
        @if (state.pageCount !== null) {
          {{ text('of') }} {{ state.pageCount || 1 }}
        }
      </span>
      <button
        type="button"
        [attr.aria-label]="text('nextPage')"
        [disabled]="!state.canNext"
        (click)="state.changePage(state.page + 1)"
      >
        ›
      </button>
      <button
        type="button"
        [attr.aria-label]="text('lastPage')"
        [disabled]="!state.canLast"
        (click)="state.changePage((state.pageCount ?? 1) - 1)"
      >
        »
      </button>
      @if (config.options?.showPageJump) {
        <label
          >{{ text('goToPage')
          }}<input type="number" min="1" [value]="state.humanPage" (change)="jump($event)"
        /></label>
      }
      @if (state.pageSizeOptions.length) {
        <label
          >{{ text('rowsPerPage')
          }}<select [value]="state.pageSize" (change)="size($event)">
            @if (!state.pageSizeOptions.includes(state.pageSize)) {
              <option [value]="state.pageSize" disabled>{{ state.pageSize }}</option>
            }
            @for (value of state.pageSizeOptions; track value) {
              <option [value]="value">{{ value }}</option>
            }
          </select></label
        >
      }
      @if (config.report) {
        <span class="neu-table2__pagination-report">{{ config.report }}</span>
      }
    }
    @if (config.filter; as state) {
      <label
        ><span [class.neu-table2__visually-hidden]="!state.menu">{{
          state.menu ? text('rule') : text('filterRule', state.column)
        }}</span>
        <select
          [attr.aria-label]="state.menu ? null : text('filterRule', state.column)"
          [value]="state.rule"
          (change)="state.setRule($event)"
        >
          @for (rule of state.rules; track rule) {
            <option [value]="rule">{{ text(rule) }}</option>
          }
        </select>
      </label>
      @if (state.needsValue) {
        <label
          ><span [class.neu-table2__visually-hidden]="!state.menu">{{
            state.menu ? text('value') : text('filterValue', state.column)
          }}</span>
          <input
            [attr.aria-label]="state.menu ? null : text('filterValue', state.column)"
            [value]="state.value"
            (input)="state.setValue($event)"
            (keydown.enter)="state.apply($event)"
          />
        </label>
      }
      @if (state.menu) {
        <div class="neu-table2__filter-actions">
          <button type="submit">{{ text('applyColumnFilter', state.column) }}</button>
          <button type="button" (click)="state.clear()">
            {{ text('clearColumnFilter', state.column) }}
          </button>
          <button type="button" (click)="state.cancel()">{{ text('cancelFilter') }}</button>
        </div>
      } @else {
        @if (state.explicit) {
          <button type="button" (click)="state.apply()">{{ text('apply') }}</button>
        }
        @if (state.canClear) {
          <button
            type="button"
            [attr.aria-label]="text('clearColumnFilter', state.column)"
            (click)="state.clear()"
          >
            {{ text('clear') }}
          </button>
        }
      }
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    .neu-table2__search {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--neu-table-space-xs, 0.25rem);
    }
    .neu-table2__column-actions {
      display: inline-flex;
      align-items: center;
      gap: var(--neu-table-space-xs, 0.25rem);
    }
    .neu-table2__column-actions button,
    .neu-table2__resize-handle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-inline-size: 2rem;
      min-block-size: 2rem;
      padding: 0.25rem 0.375rem;
      border: 1px solid var(--neu-border, currentColor);
      border-radius: var(--neu-radius-sm, 0.25rem);
      color: var(--neu-text, CanvasText);
      background: var(--neu-surface, Canvas);
      font-weight: 400;
    }
    .neu-table2__column-actions button:hover,
    .neu-table2__resize-handle:hover {
      background: var(--neu-surface-2, Canvas);
      border-color: var(--neu-border-hover, currentColor);
    }
    .neu-table2__resize-handle {
      inline-size: 2rem;
      padding: 0;
      cursor: col-resize;
      touch-action: none;
    }
    label {
      display: grid;
      gap: var(--neu-table-space-xs, 0.25rem);
    }
    :host(.pagination) label {
      display: flex;
      align-items: center;
    }
    :host(.pagination) input {
      inline-size: 4.5rem;
    }
    button,
    input,
    select {
      font: inherit;
      color: inherit;
      min-inline-size: 0;
      max-inline-size: 100%;
    }
    button {
      cursor: pointer;
    }
    button:disabled {
      cursor: default;
    }
    .neu-table2__filter-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--neu-table-space-xs, 0.25rem);
    }
    .neu-table2__visually-hidden {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    :is(button, input, select):focus-visible {
      outline: 2px solid var(--neu-focus-color, Highlight);
      outline-offset: 2px;
    }
  `,
})
export class NeuTableQueryControlsComponent {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      if (this.controls().filter?.menu)
        element.querySelector<HTMLElement>('input,select,button')?.focus();
    });
  }
  readonly controls = input<TableQueryControls>({});
  protected readonly text = (key: NeuTableMessage, column = '') =>
    tableMessage(this.controls().messages, key, { column });
  protected readonly jump = (event: Event) =>
    this.controls().pagination?.changePage(
      Number((event.currentTarget as HTMLInputElement).value) - 1,
    );
  protected readonly size = (event: Event) =>
    this.controls().pagination?.changePageSize(
      Number((event.currentTarget as HTMLSelectElement).value),
    );
}
