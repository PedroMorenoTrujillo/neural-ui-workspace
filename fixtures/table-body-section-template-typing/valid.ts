import { Component } from '@angular/core';
import {
  NeuTableCellDirective,
  NeuTableComponent,
  NeuTableLoadingDirective,
  type NeuTableColumn,
} from '@neural-ui/core/table';

interface FixtureRow {
  readonly id: number;
  readonly profile: { readonly name: string };
}

// Projection alone does not infer the parent row type for a cell directive.
// Exercise the public generic context guard explicitly.
export function readCell(context: unknown): string | null {
  if (
    NeuTableCellDirective.ngTemplateContextGuard<FixtureRow, number, 'profile'>(
      {} as NeuTableCellDirective<FixtureRow, number, 'profile'>,
      context,
    )
  ) {
    return context.$implicit.profile.name;
  }
  return null;
}

@Component({
  selector: 'neu-table-public-template-valid-fixture',
  imports: [NeuTableComponent, NeuTableCellDirective, NeuTableLoadingDirective],
  template: `
    <neu-table [columns]="columns" [data]="rows" [rowKey]="rowKey">
      <ng-template neuTableCell="profile" let-row>{{ row.profile.name }}</ng-template>
      <ng-template neuTableLoading let-loading="loading" let-retry="retry">
        @if (loading) {
          <button (click)="retry()">Retry</button>
        }
      </ng-template>
    </neu-table>
  `,
})
export class ValidTablePublicTemplateFixtureComponent {
  readonly columns: readonly NeuTableColumn<FixtureRow, 'profile'>[] = [
    { id: 'profile', header: 'Name', value: (row) => row.profile.name },
  ];
  readonly rows: readonly FixtureRow[] = [{ id: 1, profile: { name: 'Ada' } }];
  readonly rowKey = (row: FixtureRow) => row.id;
}
