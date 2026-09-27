import { H9EventContractComponent } from './h9-event-contract.component';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { NeuralIconName } from '@neural-icons/core';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuAlertComponent } from '@neural-ui/core/alert';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuCheckboxComponent } from '@neural-ui/core/checkbox';
import { NeuDialogComponent } from '@neural-ui/core/modal';
import {
  NeuTableComponent,
  NeuTableColumn,
} from '@neural-ui/core/table';
import {
  NeuTreeLoadedRelation,
  NeuTreeTableColumn,
  NeuTreeTableComponent,
  NeuTreeTableHierarchy,
} from '@neural-ui/core/tree-table';
import { NeuNavComponent, NeuNavItem } from '@neural-ui/core/nav';
import { NeuDateInputComponent } from '@neural-ui/core/date-input';
import { NeuNotificationCenterComponent } from '@neural-ui/core/notification-center';
import { NeuMegaMenuComponent } from '@neural-ui/core/mega-menu';
import { NeuKanbanComponent } from '@neural-ui/core/kanban';
import { NeuColorPickerComponent } from '@neural-ui/core/color-picker';

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
    NeuButtonComponent,
    NeuAlertComponent,
    NeuDateInputComponent,
    NeuNotificationCenterComponent,
    NeuMegaMenuComponent,
    NeuKanbanComponent,
    NeuColorPickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h9-event-contract />
    <neu-nav [items]="navItems"></neu-nav>
    <neu-alert tone="success">Icons are available without global internal registration.</neu-alert>
    <button neu-button id="icon-save" icon="save" (neuClick)="incrementActions()">Save</button>
    <button neu-button id="icon-download" icon="download" iconPosition="end">Download</button>
    <button neu-button id="icon-only" icon="save" [iconOnly]="true" ariaLabel="Save item"></button>
    <button neu-button id="icon-dynamic" [icon]="dynamicIcon()">Dynamic</button>
    <button id="icon-switch" type="button" (click)="dynamicIcon.set('download')">Switch icon</button>
    <button neu-button id="icon-missing" icon="trash" [iconOnly]="true" ariaLabel="Missing icon"></button>
    <span id="icon-actions">{{ actions() }}</span>
    <neu-input [formControl]="name" label="Name"></neu-input>
    <neu-checkbox [formControl]="accepted" label="Accepted"></neu-checkbox>
    <neu-dialog [open]="false" title="Compatibility dialog"></neu-dialog>
    <neu-table
      [columns]="tableColumns"
      [data]="rows"
      [rowKey]="rowKey"
    ></neu-table>
    <neu-tree-table
      [data]="rows"
      [hierarchy]="hierarchy"
      [columns]="treeColumns"
      [rowKey]="rowKey"
      [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
    ></neu-tree-table>
    <neu-date-input id="rel01e-date" />
    <neu-notification-center id="rel01e-notification" />
    <neu-mega-menu id="rel01e-mega" [items]="[]" />
    <neu-kanban id="rel01e-kanban" [columns]="[]" />
    <neu-color-picker id="rel01e-color" />
  `,
})
export class AppComponent {
  readonly actions = signal(0);
  readonly dynamicIcon = signal<NeuralIconName>('save');
  incrementActions(): void { this.actions.update((count) => count + 1); }
  readonly name = new FormControl('', { nonNullable: true });
  readonly accepted = new FormControl(false, { nonNullable: true });
  readonly navItems: NeuNavItem[] = [
    { id: 'home', label: 'Home', icon: 'home', route: '/' },
  ];
  readonly rows: readonly CompatibilityRow[] = [
    { id: 1, name: 'Neural UI' },
    { id: 2, name: 'TreeTable' },
  ];
  readonly tableColumns: readonly NeuTableColumn<CompatibilityRow, CompatibilityField>[] = [
    { id: 'name', header: 'Name', field: 'name' },
  ];
  readonly treeColumns: readonly NeuTreeTableColumn<CompatibilityRow, CompatibilityField>[] = [
    { id: 'name', header: 'Name', field: 'name' },
  ];
  readonly rowKey = (row: CompatibilityRow): number => row.id;
  readonly hierarchy: NeuTreeTableHierarchy<number> = {
    hierarchyRevision: 1,
    queryRevision: 0,
    roots: loaded([1]),
    children: [{ parentKey: 1, relation: loaded([2]) }],
  };
}

interface CompatibilityRow {
  readonly id: number;
  readonly name: string;
}

type CompatibilityField = 'name';

const loaded = (keys: readonly number[]): NeuTreeLoadedRelation<number> => ({
  status: 'loaded',
  keys,
  relationRevision: 1,
  appliedRequestId: null,
  total: keys.length,
  completeness: 'complete',
});
