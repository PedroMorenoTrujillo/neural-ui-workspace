import { H9EventContractComponent } from './h9-event-contract.component';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuCheckboxComponent } from '@neural-ui/core/checkbox';
import { NeuDialogComponent } from '@neural-ui/core/modal';
import {
  NeuTableComponent,
  NeuTableColumn,
  NeuTableQueryState,
  NeuTableServerState,
} from '@neural-ui/core/table';
import { NeuTreeTableComponent, NeuTreeTableNode } from '@neural-ui/core/tree-table';
import { NeuNavComponent, NeuNavItem } from '@neural-ui/core/nav';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    H9EventContractComponent,
    NeuInputComponent,
    NeuCheckboxComponent,
    NeuDialogComponent,
    NeuTableComponent,
    NeuTreeTableComponent,
    NeuNavComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h9-event-contract />
    <neu-nav [items]="navItems"></neu-nav>
    <neu-input [formControl]="name" label="Name"></neu-input>
    <neu-checkbox [formControl]="accepted" label="Accepted"></neu-checkbox>
    <neu-dialog [open]="false" title="Compatibility dialog"></neu-dialog>
    <neu-table
      [columns]="columns"
      [data]="rows"
      [pagination]="false"
      [serverSide]="true"
      [lazyLoadOnInit]="true"
      [query]="query()"
      (queryChange)="query.set($event)"
      (serverStateChange)="onLegacyServerState($event)"
    ></neu-table>
    <neu-tree-table [nodes]="treeNodes" [columns]="columns" [pagination]="false"></neu-tree-table>
  `,
})
export class AppComponent {
  readonly name = new FormControl('', { nonNullable: true });
  readonly accepted = new FormControl(false, { nonNullable: true });
  readonly navItems: NeuNavItem[] = [
    { id: 'home', label: 'Home', icon: 'lucideHouse', route: '/' },
  ];
  readonly columns: NeuTableColumn[] = [{ key: 'name', header: 'Name' }];
  readonly rows = [{ id: 1, name: 'Neural UI' }];
  readonly treeNodes: NeuTreeTableNode[] = [
    { id: 'root', label: 'Neural UI', children: [{ id: 'child', label: 'TreeTable' }] },
  ];
  readonly query = signal<NeuTableQueryState | undefined>(undefined);
  onLegacyServerState(state: NeuTableServerState): void {
    void state.page;
  }
}
