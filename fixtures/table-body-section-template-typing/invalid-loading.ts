import { Component } from '@angular/core';
import { NeuTableComponent, NeuTableLoadingDirective } from '@neural-ui/core/table';

@Component({
  imports: [NeuTableComponent, NeuTableLoadingDirective],
  template: `
    <neu-table [columns]="[]" [data]="rows" [rowKey]="rowKey">
      <ng-template neuTableLoading let-row="row">{{ row.name }}</ng-template>
    </neu-table>
  `,
})
export class InvalidLoadingContextFixture {
  readonly rows = [{ id: 1, name: 'Ada' }];
  readonly rowKey = (row: { id: number }) => row.id;
}
