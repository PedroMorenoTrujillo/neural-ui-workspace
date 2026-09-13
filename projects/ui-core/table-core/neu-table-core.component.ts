import {
  Component,
  ViewEncapsulation,
  contentChild,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  NeuTableCoreBodyDirective,
  NeuTableCoreCaptionDirective,
  NeuTableCoreEmptyDirective,
  NeuTableCoreHeaderDirective,
  NeuTableCoreLoadingDirective,
  NeuTableCoreSummaryDirective,
} from './neu-table-core-templates.directive';
import type {
  NeuTableCoreBodyContext,
  NeuTableCoreCellContext,
  NeuTableCoreColumn,
  NeuTableCoreEmptyContext,
  NeuTableCoreRow,
  NeuTableCoreRowKey,
  NeuTableCoreRowTrackBy,
  NeuTableCoreStructuralContext,
} from './neu-table-core.types';

type NeuTableCoreData<T extends object> = [T] extends [Record<string, unknown>]
  ? readonly T[] | readonly object[]
  : readonly T[];

/**
 * Lightweight semantic Table renderer.
 *
 * This component intentionally owns no query, Forms, CDK, Router, selection,
 * editing, export, persistence, URL-state, or virtual-scroll behavior. Use
 * `NeuTableComponent` from `@neural-ui/core/table` for the batteries-included
 * compatibility surface.
 */
@Component({
  selector: 'neu-table-core',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-table-core__host',
    '[class.neu-table-core__host--compact]': 'density() === "compact"',
    '[class.neu-table-core__host--relaxed]': 'density() === "relaxed"',
  },
  template: `
    <section
      class="neu-table-core-container"
      [class.neu-table-core-container--bordered]="bordered()"
      [class.neu-table-core-container--rounded]="roundedBorders()"
      [class.neu-table-core-container--striped]="stripedRows()"
      [attr.aria-busy]="loading() ? 'true' : null"
    >
      <div class="neu-table-core__scroll-container">
        <table class="neu-table-core" [attr.aria-label]="tableAriaLabel()">
          @if (captionTemplate(); as caption) {
            <caption class="neu-table-core__caption">
              <ng-container
                [ngTemplateOutlet]="caption.templateRef"
                [ngTemplateOutletContext]="structuralContext()"
              />
            </caption>
          } @else if (title()) {
            <caption class="neu-table-core__caption">
              {{
                title()
              }}
            </caption>
          }

          <thead class="neu-table-core__head">
            @if (headerTemplate(); as header) {
              <ng-container
                [ngTemplateOutlet]="header.templateRef"
                [ngTemplateOutletContext]="structuralContext()"
              />
            } @else {
              <tr>
                @if (showRowNumbers()) {
                  <th class="neu-table-core__th neu-table-core__th--row-number" scope="col">#</th>
                }
                @for (column of columns(); track column.key) {
                  <th
                    class="neu-table-core__th"
                    [class]="column.cellClass ?? ''"
                    [style.width]="column.width ?? null"
                    [style.text-align]="column.align ?? 'left'"
                    scope="col"
                  >
                    @if (column.headerTemplate) {
                      <ng-container
                        [ngTemplateOutlet]="column.headerTemplate"
                        [ngTemplateOutletContext]="{ $implicit: column, column }"
                      />
                    } @else {
                      {{ column.header }}
                    }
                  </th>
                }
              </tr>
            }
          </thead>

          <tbody class="neu-table-core__body">
            @if (loading()) {
              @if (loadingTemplate(); as loadingBody) {
                <ng-container
                  [ngTemplateOutlet]="loadingBody.templateRef"
                  [ngTemplateOutletContext]="structuralContext()"
                />
              } @else {
                @for (skeleton of skeletonIndexes(); track skeleton) {
                  <tr class="neu-table-core__row neu-table-core__row--loading" aria-hidden="true">
                    @if (showRowNumbers()) {
                      <td class="neu-table-core__td neu-table-core__td--row-number">
                        <span class="neu-table-core__skeleton"></span>
                      </td>
                    }
                    @for (column of columns(); track column.key) {
                      <td class="neu-table-core__td">
                        <span class="neu-table-core__skeleton"></span>
                      </td>
                    }
                  </tr>
                }
              }
            } @else if (data().length === 0) {
              <tr>
                <td
                  class="neu-table-core__td neu-table-core__td--empty"
                  [attr.colspan]="columnCount()"
                >
                  @if (emptyTemplate(); as empty) {
                    <ng-container
                      [ngTemplateOutlet]="empty.templateRef"
                      [ngTemplateOutletContext]="emptyContext()"
                    />
                  } @else {
                    <div class="neu-table-core__empty">{{ emptyMessage() }}</div>
                  }
                </td>
              </tr>
            } @else {
              @for (row of data(); track rowTrackingKey(rowIndex, row); let rowIndex = $index) {
                <tr class="neu-table-core__row" [class]="rowClass()(typedRow(row), rowIndex)">
                  @if (bodyTemplate(); as body) {
                    <ng-container
                      [ngTemplateOutlet]="body.templateRef"
                      [ngTemplateOutletContext]="bodyContext(typedRow(row), rowIndex)"
                    />
                  } @else {
                    @if (showRowNumbers()) {
                      <td class="neu-table-core__td neu-table-core__td--row-number">
                        {{ rowIndex + 1 }}
                      </td>
                    }
                    @for (column of columns(); track column.key) {
                      @let value = cellValue(typedRow(row), column);
                      <td
                        class="neu-table-core__td"
                        [class]="column.cellClass ?? ''"
                        [style.text-align]="column.align ?? 'left'"
                      >
                        @if (column.cellTemplate) {
                          <ng-container
                            [ngTemplateOutlet]="column.cellTemplate"
                            [ngTemplateOutletContext]="
                              cellContext(typedRow(row), rowIndex, column, value)
                            "
                          />
                        } @else {
                          {{ value }}
                        }
                      </td>
                    }
                  }
                </tr>
              }
            }
          </tbody>

          @if (footerRow(); as footer) {
            <tfoot class="neu-table-core__foot">
              <tr>
                @if (showRowNumbers()) {
                  <td class="neu-table-core__td neu-table-core__td--row-number"></td>
                }
                @for (column of columns(); track column.key) {
                  <td
                    class="neu-table-core__td neu-table-core__td--footer"
                    [style.text-align]="column.align ?? 'left'"
                  >
                    {{ footer[column.key] ?? '' }}
                  </td>
                }
              </tr>
            </tfoot>
          }
        </table>
      </div>

      @if (summaryTemplate(); as summary) {
        <div class="neu-table-core__summary">
          <ng-container
            [ngTemplateOutlet]="summary.templateRef"
            [ngTemplateOutletContext]="structuralContext()"
          />
        </div>
      }
    </section>
  `,
  styleUrl: './neu-table-core.component.scss',
})
export class NeuTableCoreComponent<T extends object = NeuTableCoreRow> {
  readonly columns = input.required<readonly NeuTableCoreColumn<T>[]>();
  readonly data = input<NeuTableCoreData<T>>([]);
  readonly loading = input(false);
  readonly title = input('');
  readonly emptyMessage = input('No results');
  readonly tableAriaLabel = input('Data table');
  readonly rowKey = input<NeuTableCoreRowKey<T>>('id' as NeuTableCoreRowKey<T>);
  readonly rowTrackBy = input<NeuTableCoreRowTrackBy<T> | undefined>(undefined);
  readonly skeletonRows = input(5);
  readonly bordered = input(true);
  readonly roundedBorders = input(true);
  readonly stripedRows = input(false);
  readonly density = input<'compact' | 'default' | 'relaxed'>('default');
  readonly showRowNumbers = input(false);
  readonly rowClass = input<(row: T, rowIndex: number) => string>(() => '');
  readonly footerRow = input<Readonly<Record<string, unknown>> | null>(null);

  /* v8 ignore start -- Angular signal-query factories; every projected table-core slot is covered. */
  protected readonly captionTemplate = contentChild<NeuTableCoreCaptionDirective<T>>(
    NeuTableCoreCaptionDirective,
  );
  protected readonly headerTemplate = contentChild<NeuTableCoreHeaderDirective<T>>(
    NeuTableCoreHeaderDirective,
  );
  protected readonly bodyTemplate =
    contentChild<NeuTableCoreBodyDirective<T>>(NeuTableCoreBodyDirective);
  protected readonly loadingTemplate = contentChild<NeuTableCoreLoadingDirective<T>>(
    NeuTableCoreLoadingDirective,
  );
  protected readonly emptyTemplate = contentChild<NeuTableCoreEmptyDirective<T>>(
    NeuTableCoreEmptyDirective,
  );
  protected readonly summaryTemplate = contentChild<NeuTableCoreSummaryDirective<T>>(
    NeuTableCoreSummaryDirective,
  );
  /* v8 ignore stop */

  protected skeletonIndexes(): readonly number[] {
    const count = Math.max(1, Math.trunc(this.skeletonRows()));
    return Array.from({ length: count }, (_, index) => index);
  }

  protected columnCount(): number {
    return this.columns().length + (this.showRowNumbers() ? 1 : 0);
  }

  protected typedRow(row: T | object): T {
    return row as T;
  }

  protected rowTrackingKey(index: number, row: T | object): unknown {
    const typed = this.typedRow(row);
    const trackBy = this.rowTrackBy();
    if (trackBy) return trackBy(index, typed);
    const identity = this.rowKey();
    if (typeof identity === 'function') return identity(typed);
    return (typed as Record<string, unknown>)[identity as string] ?? typed;
  }

  protected cellValue<K extends string>(row: T, column: NeuTableCoreColumn<T, K>): unknown {
    return column.value ? column.value(row) : (row as Record<string, unknown>)[column.key];
  }

  protected structuralContext(): NeuTableCoreStructuralContext<T> {
    return Object.freeze({
      $implicit: this.columns(),
      columns: this.columns(),
      rows: this.data() as readonly T[],
    });
  }

  protected bodyContext(row: T, rowIndex: number): NeuTableCoreBodyContext<T> {
    return Object.freeze({
      $implicit: row,
      row,
      rowIndex,
      columns: this.columns(),
      rows: this.data() as readonly T[],
    });
  }

  protected cellContext<K extends string>(
    row: T,
    rowIndex: number,
    column: NeuTableCoreColumn<T, K>,
    value: unknown,
  ): NeuTableCoreCellContext<T, K> {
    return Object.freeze({ $implicit: value, value, row, rowIndex, column });
  }

  protected emptyContext(): NeuTableCoreEmptyContext<T> {
    return Object.freeze({ ...this.structuralContext(), message: this.emptyMessage() });
  }
}
