import { Component } from '@angular/core';
import {
  NeuTableBodySectionDirective,
  NeuTableComponent,
  NeuTableManagedRowDirective,
  type NeuTableColumn,
} from '@neural-ui/core/table';

interface FixtureRow {
  readonly id: number;
  readonly name: string;
}

@Component({
  selector: 'neu-table-body-section-invalid-fixture',
  imports: [NeuTableComponent, NeuTableBodySectionDirective, NeuTableManagedRowDirective],
  template: `
    <neu-table [columns]="columns" [data]="rows">
      <ng-template neuTableBodySection [neuTableBodySectionOf]="rows" let-entries>
        @for (entry of entries; track entry.key) {
          @if (entry.kind === 'data') {
            <tr [neuTableManagedRow]="entry">
              <td>{{ entry.row.missing }}</td>
            </tr>
          } @else if (entry.kind === 'placeholder') {
            <tr>
              <td>{{ entry.row.name }}</td>
            </tr>
          }
        }
      </ng-template>
    </neu-table>
  `,
})
export class InvalidTableBodySectionFixtureComponent {
  readonly columns: readonly NeuTableColumn<FixtureRow>[] = [{ key: 'name', header: 'Name' }];
  readonly rows: readonly FixtureRow[] = [{ id: 1, name: 'Ada' }];
}
