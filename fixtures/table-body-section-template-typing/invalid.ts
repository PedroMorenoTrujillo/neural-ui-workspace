import { Component } from '@angular/core';
import {
  NeuTableCellDirective,
  NeuTableComponent,
  NeuTableLoadingDirective,
  type NeuTableColumn,
} from '@neural-ui/core/table';

interface FixtureRow {
  readonly id: number;
  readonly name: string;
}

export function readInvalidCell(context: unknown): unknown {
  if (
    NeuTableCellDirective.ngTemplateContextGuard<FixtureRow, number, 'name'>(
      {} as NeuTableCellDirective<FixtureRow, number, 'name'>,
      context,
    )
  ) {
    return context.$implicit.missing;
  }
  return null;
}

@Component({
  selector: 'neu-table-public-template-invalid-fixture',
  imports: [NeuTableComponent, NeuTableLoadingDirective],
  template: `
    <neu-table [columns]="columns" [data]="rows" [rowKey]="rowKey">
      <ng-template neuTableLoading let-loading="loading">{{ loading }}</ng-template>
    </neu-table>
  `,
})
export class InvalidTablePublicTemplateFixtureComponent {
  readonly columns: readonly NeuTableColumn<FixtureRow, 'name'>[] = [
    { id: 'name', header: 'Name', value: (row) => row.name },
  ];
  readonly rows: readonly FixtureRow[] = [{ id: 1, name: 'Ada' }];
  readonly rowKey = (row: FixtureRow) => row.id;
}
