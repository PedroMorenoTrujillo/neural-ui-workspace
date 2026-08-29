import { Component } from '@angular/core';
import {
  NeuTableBodySectionDirective,
  NeuTableComponent,
  NeuTableManagedRowDirective,
  type NeuTableColumn,
} from '@neural-ui/core/table';

interface FixtureRow {
  readonly id: number;
  readonly profile: { readonly name: string };
}

@Component({
  selector: 'neu-table-body-section-valid-fixture',
  imports: [NeuTableComponent, NeuTableBodySectionDirective, NeuTableManagedRowDirective],
  template: `
    <neu-table [columns]="columns" [data]="rows">
      <ng-template
        neuTableBodySection
        [neuTableBodySectionOf]="rows"
        let-entries
        let-colspan="colspan"
      >
        @for (entry of entries; track entry.key) {
          @if (entry.kind === 'data') {
            <tr [neuTableManagedRow]="entry">
              <td>{{ entry.row.profile.name }}</td>
              <td>{{ entry.logicalIndex }} / {{ entry.selected }}</td>
            </tr>
          } @else if (entry.kind === 'placeholder') {
            <tr aria-hidden="true">
              <td [attr.colspan]="entry.colspan">Placeholder {{ entry.logicalIndex }}</td>
            </tr>
          } @else if (entry.kind === 'empty') {
            <tr>
              <td [attr.colspan]="colspan">{{ entry.message }}</td>
            </tr>
          }
        }
      </ng-template>
    </neu-table>
  `,
})
export class ValidTableBodySectionFixtureComponent {
  readonly columns: readonly NeuTableColumn<FixtureRow>[] = [
    { key: 'profile', header: 'Name' },
  ];
  readonly rows: readonly FixtureRow[] = [{ id: 1, profile: { name: 'Ada' } }];
}
