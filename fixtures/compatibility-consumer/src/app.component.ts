import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuDialogComponent } from '@neural-ui/core/modal';
import {
  NeuTableComponent,
  NeuTableColumn,
  NeuTableQueryState,
  NeuTableServerState,
} from '@neural-ui/core/table';
import { NeuNavComponent, NeuNavItem } from '@neural-ui/core/nav';
import { NeuChartComponent } from '@neural-ui/core/chart';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, NeuInputComponent, NeuDialogComponent, NeuTableComponent, NeuNavComponent, NeuChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <neu-nav [items]="navItems"></neu-nav>
    <neu-input [formControl]="name" label="Name"></neu-input>
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
    <neu-chart [series]="series" [categories]="['Now']"></neu-chart>
  `,
})
export class AppComponent {
  readonly name = new FormControl('', { nonNullable: true });
  readonly navItems: NeuNavItem[] = [{ id: 'home', label: 'Home', icon: 'lucideHouse', route: '/' }];
  readonly columns: NeuTableColumn[] = [{ key: 'name', header: 'Name' }];
  readonly rows = [{ id: 1, name: 'Neural UI' }];
  readonly query = signal<NeuTableQueryState | undefined>(undefined);
  readonly series = [{ name: 'Users', data: [1] }];

  onLegacyServerState(state: NeuTableServerState): void {
    void state.page;
  }
}
