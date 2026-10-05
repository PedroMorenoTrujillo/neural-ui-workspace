import { afterNextRender, Component, ElementRef, inject, input, type TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuSelectComponent } from '@neural-ui/core/select';
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
  readonly menu?: {
    readonly filter: TableFilterControls;
    readonly template: TemplateRef<unknown> | null;
    readonly context: object;
  };
}

export interface TableSearchControls {
  readonly value: string;
  readonly appliedValue: string;
  readonly immediate: boolean;
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
  readonly toggle?: {
    readonly expanded: boolean;
    readonly label: string;
    readonly controls?: string | null;
    readonly template?: TemplateRef<unknown> | null;
    readonly context?: object;
    readonly content?: string;
    readonly activate: (event: Event) => void;
  };
  readonly edit?: {
    readonly active: boolean;
    readonly disabled: boolean;
    readonly pending: boolean;
    readonly label: string;
    readonly begin: (event: Event) => void;
    readonly commit: () => void;
    readonly cancel: () => void;
  };
}

/** Optional query UI. Kept out of the basic Table's initial dependency closure. */
@Component({
  selector: 'neu-table-query-controls',
  imports: [NeuButtonComponent, NeuInputComponent, NeuSelectComponent, CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, NgTemplateOutlet],
  host: { '[class.pagination]': '!!controls().pagination' },
  template: `
    @let config = controls();
    @if (config.toggle; as state) {
      <button neu-button variant="ghost" tone="neutral" size="sm" type="button"
        class="neu-table2__disclosure" data-neu-selection-stop
        [ariaLabel]="state.label" [attr.aria-expanded]="state.expanded"
        [attr.aria-controls]="state.controls" (click)="state.activate($event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          [class.expanded]="state.expanded"><path d="m9 5 7 7-7 7" /></svg>
        @if (state.template; as template) {
          <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="state.context" />
        } @else if (state.content) { {{ state.content }} }
      </button>
    }
    @if (config.search; as state) {
      <form class="neu-table2__search" role="search" (submit)="finishSearch(state, $event, searchInput, 'commit')">
        <neu-input #searchInput type="search" [label]="text('searchTable')" [floatingLabel]="true" size="sm"
          [value]="state.value" (focusin)="state.begin()" (valueChange)="searchValue(state, $event)"
          (keydown.escape)="finishSearch(state, $event, searchInput, 'cancel')" />
        @if (!state.immediate) { <button neu-button size="sm" type="submit">{{ text('search') }}</button> }
        <button neu-button size="sm" variant="outline" type="button" [ariaLabel]="text('clearSearch')" (click)="finishSearch(state, $event, searchInput, 'clear')">
          {{ text('clear') }}
        </button>
      </form>
    }
    @if (config.column; as state) {
      <span class="neu-table2__column-actions" cdkOverlayOrigin #filterOrigin="cdkOverlayOrigin" data-neu-selection-stop>
        @if (state.filter) {
          <button
            neu-button variant="ghost" size="sm" class="neu-table2__filter-trigger"
            [tone]="state.filtered ? 'brand' : 'neutral'"
            type="button"
            aria-haspopup="dialog"
            [attr.aria-expanded]="state.open"
            [attr.aria-pressed]="state.filtered"
            [ariaLabel]="text('filterColumn', state.name)"
            (click)="state.action('filter', $event)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16l-6 7v6l-4 2v-8Z" /></svg>
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
      <ng-template cdkConnectedOverlay [cdkConnectedOverlayOrigin]="filterOrigin"
        [cdkConnectedOverlayOpen]="state.open" [cdkConnectedOverlayHasBackdrop]="true"
        cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
        [cdkConnectedOverlayPush]="true" [cdkConnectedOverlayViewportMargin]="8"
        (backdropClick)="state.menu?.filter?.cancel()"
        (overlayKeydown)="$event.key === 'Escape' && state.menu?.filter?.cancel()">
        @if (state.menu; as menu) {
          <form class="neu-table2__filter-menu" role="dialog" cdkTrapFocus [cdkTrapFocusAutoCapture]="true"
            [attr.aria-label]="text('filterColumn', state.name)" [attr.data-filter-editor]="state.id"
            (submit)="menu.template ? $event.preventDefault() : menu.filter.apply($event)">
            @if (menu.template; as template) {
              <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="menu.context" />
            } @else {
              <neu-table-query-controls [controls]="{ filter: menu.filter, messages: config.messages }" />
            }
          </form>
        }
      </ng-template>
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
        neu-button variant="ghost" size="sm" class="neu-table2__page-control"
        type="button"
        [ariaLabel]="text('firstPage')"
        [disabled]="!state.canFirst"
        (click)="state.changePage(0)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 5v14m10-14-7 7 7 7" /></svg>
      </button>
      <button
        neu-button variant="ghost" size="sm" class="neu-table2__page-control"
        type="button"
        [ariaLabel]="text('previousPage')"
        [disabled]="!state.canPrevious"
        (click)="state.changePage(state.page - 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
      </button>
      <span class="neu-table2__visually-hidden"
        >{{ text('page') }} {{ state.humanPage }}
        @if (state.pageCount !== null) {
          {{ text('of') }} {{ state.pageCount || 1 }}
        }
      </span>
      @for (page of pages(state); track page) {
        <button neu-button variant="ghost" size="sm" type="button" class="neu-table2__page-number"
          [ariaLabel]="text('page') + ' ' + (page + 1)"
          [attr.aria-current]="page === state.page ? 'page' : null"
          (click)="state.changePage(page)">{{ page + 1 }}</button>
      }
      <button
        neu-button variant="ghost" size="sm" class="neu-table2__page-control"
        type="button"
        [ariaLabel]="text('nextPage')"
        [disabled]="!state.canNext"
        (click)="state.changePage(state.page + 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
      </button>
      <button
        neu-button variant="ghost" size="sm" class="neu-table2__page-control"
        type="button"
        [ariaLabel]="text('lastPage')"
        [disabled]="!state.canLast"
        (click)="state.changePage((state.pageCount ?? 1) - 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 5v14M7 5l7 7-7 7" /></svg>
      </button>
      @if (config.options?.showPageJump) {
        <label
          >{{ text('goToPage')
          }}<input type="number" min="1" [value]="state.humanPage" (change)="jump($event)"
        /></label>
      }
      @if (state.pageSizeOptions.length) {
        <neu-select #pageSizeControl class="neu-table2__page-size" size="sm" mode="single"
          [floatingLabel]="false" [ariaLabel]="text('rowsPerPage')"
          [options]="sizes(state)" [optionDisabled]="disabledSize(state)" [value]="state.pageSize"
          (valueChange)="changeSize(state, $event, pageSizeControl)" />
      }
      @if (config.report) {
        <span class="neu-table2__pagination-report">{{ config.report }}</span>
      }
    }
    @if (config.filter; as state) {
      <neu-select #ruleControl size="sm" mode="single" [label]="state.menu ? text('rule') : text('filterRule', state.column)"
        [floatingLabel]="true" [ariaLabel]="text('filterRule', state.column)"
        [options]="state.rules" [optionLabel]="ruleLabel" [value]="state.rule"
        (valueChange)="changeRule(state, $event, ruleControl)" />
      @if (state.needsValue) {
        <neu-input [label]="text('filterValue', state.column)" [floatingLabel]="true" size="sm"
          [value]="state.value" (valueChange)="filterValue(state, $event)"
          (keydown.enter)="state.apply($event)" />
      }
      @if (state.menu) {
        <div class="neu-table2__filter-actions">
          <button neu-button size="sm" type="submit" [ariaLabel]="text('applyColumnFilter', state.column)">{{ text('apply') }}</button>
          <button neu-button size="sm" variant="outline" type="button" [ariaLabel]="text('clearColumnFilter', state.column)" (click)="state.clear()">
            {{ text('clear') }}
          </button>
          <button neu-button size="sm" variant="ghost" type="button" (click)="state.cancel()">{{ text('cancelFilter') }}</button>
        </div>
      } @else {
        @if (state.explicit) {
          <button neu-button size="sm" type="button" (click)="state.apply()">{{ text('apply') }}</button>
        }
        @if (state.canClear) {
          <button
            neu-button variant="outline" size="sm"
            type="button"
            [ariaLabel]="text('clearColumnFilter', state.column)"
            (click)="state.clear()"
          >
            {{ text('clear') }}
          </button>
        }
      }
    }
    @if (config.edit; as state) {
      <span class="neu-table2__edit-actions" data-neu-selection-stop>
        @if (state.active) {
          <button neu-button size="sm" type="button" [disabled]="state.pending" (click)="state.commit()">{{ text('save') }}</button>
          <button neu-button size="sm" variant="outline" type="button" (click)="state.cancel()">{{ text('cancel') }}</button>
        } @else {
          <button neu-button size="sm" variant="ghost" type="button" [disabled]="state.disabled" [ariaLabel]="state.label" (click)="state.begin($event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7l-4-4L4 15Z" /></svg>
            {{ text('edit', '') }}
          </button>
        }
      </span>
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
      padding-block-start: .5rem;
      inline-size: min(28rem, 100%);
    }
    .neu-table2__search neu-input { inline-size: min(20rem, 100%); }
    .neu-table2__filter-trigger[aria-pressed="true"] { background:var(--neu-primary-soft); }
    .neu-table2__page-size { inline-size: 4.75rem; margin-inline-start:.5rem; }
    svg { inline-size: 1rem; block-size: 1rem; flex: 0 0 auto; }
    .neu-table2__edit-actions { display: inline-flex; align-items:center; gap:.5rem; }
    .neu-table2__edit-actions button, .neu-table2__search button { block-size:2.25rem; padding-block:0; }
    .neu-table2__disclosure { border:0; min-block-size:2.25rem; padding:.375rem; gap:.75rem; font-weight:600; }
    .neu-table2__disclosure svg.expanded { transform:rotate(90deg); }
    .neu-table2__page-control, .neu-table2__page-number { min-inline-size:2.25rem; min-block-size:2.25rem; }
    .neu-table2__page-number[aria-current] { background: var(--neu-primary-soft); color: var(--neu-primary); font-weight:600; }
    .neu-table2__pagination-report { color:var(--neu-text-muted); margin-inline-start:.75rem; }
    .neu-table2__column-actions {
      display: inline-flex;
      align-items: center;
      gap: var(--neu-table-space-xs, 0.25rem);
    }
    .neu-table2__column-actions button:not([neu-button]),
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
    .neu-table2__column-actions button:not([neu-button]):hover,
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
    select, input:not(.neu-input__control) {
      min-block-size:2.25rem; padding:.375rem .625rem;
      border:1px solid var(--neu-border); border-radius:var(--neu-radius-sm, .25rem);
      background:var(--neu-surface); color:var(--neu-text);
    }
    neu-select, neu-input { min-inline-size:0; }
    :host:not(.pagination) > neu-select, :host:not(.pagination) > neu-input { padding-block-start:.5rem; }
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
    .neu-table2__filter-menu {
      display:grid; gap:.75rem; inline-size:min(18rem, calc(100vw - 1rem));
      max-block-size:calc(100dvh - 1rem); overflow:auto;
      padding:1rem; border:1px solid var(--neu-border); border-radius:var(--neu-radius-sm, .25rem);
      background:var(--neu-surface); color:var(--neu-text);
      box-shadow:0 .25rem 1rem color-mix(in srgb, currentColor 12%, transparent);
      font:400 1rem/1.5 var(--neu-font-sans, inherit);
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
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly searchValue = (state: TableSearchControls, value: string) => {
    if (this.restoringControl) return;
    const input = this.element.querySelector<HTMLInputElement>('input');
    if (input) { input.value = value; state.update({ currentTarget: input } as unknown as Event); }
  };
  protected readonly finishSearch = (state: TableSearchControls, event: Event, control: NeuInputComponent,
    action: 'commit' | 'cancel' | 'clear') => {
    state[action](event);
    this.restoreControl(() => control.value.set(state.appliedValue));
    // A draft can be cancelled before Angular renders the intervening model value.
    // Restore the native field too, so its text always reflects the applied query.
    const input = this.element.querySelector<HTMLInputElement>('.neu-table2__search input');
    if (input) input.value = state.appliedValue;
  };
  protected readonly filterValue = (state: TableFilterControls, value: string) => {
    const input = this.element.querySelector<HTMLInputElement>('neu-input input');
    if (input) { input.value = value; state.setValue({ currentTarget: input } as unknown as Event); }
  };
  protected readonly pages = (state: NeuTablePaginatorContext) => {
    if (state.pageCount === null) return [state.page];
    const count = Math.max(1, state.pageCount);
    const start = Math.max(0, Math.min(state.page - 2, count - 5));
    return Array.from({ length: Math.min(5, count) }, (_, i) => start + i);
  };
  protected readonly ruleLabel = (rule: NeuFilterConstraint<string>['rule']) => this.text(rule);
  protected readonly sizes = (state: NeuTablePaginatorContext) => state.pageSizeOptions.includes(state.pageSize)
    ? state.pageSizeOptions : [state.pageSize, ...state.pageSizeOptions];
  protected readonly disabledSize = (state: NeuTablePaginatorContext) => (size: number) => !state.pageSizeOptions.includes(size);
  private restoringControl = false;
  private restoreControl(restore: () => void): void {
    this.restoringControl = true;
    try { restore(); } finally { this.restoringControl = false; }
  }
  protected readonly changeRule = (state: TableFilterControls, rule: NeuFilterConstraint<string>['rule'] | null,
    control: NeuSelectComponent<NeuFilterConstraint<string>['rule'], NeuFilterConstraint<string>['rule']>) => {
    if (this.restoringControl) return;
    if (rule !== null) state.setRule({ currentTarget: { value: rule } } as unknown as Event);
    this.restoreControl(() => control.value.set(state.rule));
  };
  protected readonly changeSize = (state: NeuTablePaginatorContext, size: number | null,
    control: NeuSelectComponent<number, number>) => {
    if (this.restoringControl) return;
    if (size !== null) state.changePageSize(size);
    this.restoreControl(() => control.value.set(state.pageSize));
  };
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
