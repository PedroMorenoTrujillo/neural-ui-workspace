import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
  NeuTableColumn,
  NeuTableComponent,
} from '@neural-ui/core';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  joined: string;
}

@Component({
  selector: 'app-table-demo',
  imports: [
    NeuTableComponent,
    NeuBadgeComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuCodeBlockComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table-demo.component.html',
  styleUrl: './table-demo.component.scss',
})
export class TableDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  readonly columns: NeuTableColumn[] = [
    { key: 'id', header: 'ID', width: '60px', align: 'center', sortable: true },
    { key: 'name', header: 'Nombre', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Rol', sortable: true },
    { key: 'status', header: 'Estado', sortable: true },
    { key: 'joined', header: 'Alta', sortable: true },
  ];

  readonly data: User[] = Array.from({ length: 47 }, (_, i) => ({
    id: i + 1,
    name: [
      'Ana García',
      'Luis Martínez',
      'Sofía López',
      'Carlos Ruiz',
      'Elena Torres',
      'David Sánchez',
      'Marta Díaz',
      'Pablo Fernández',
      'Laura Gómez',
      'Javier Moreno',
    ][i % 10],
    email: `user${i + 1}@neural.io`,
    role: ['Admin', 'Editor', 'Viewer', 'Developer', 'Manager'][i % 5],
    status: (['active', 'inactive', 'pending'] as const)[i % 3],
    joined: `${2020 + (i % 5)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  }));

  // Configurador
  cfg = {
    searchable: true,
    sortable: true,
    selectable: false,
    pageSize: 10,
  };

  readonly selectedRows = signal<User[]>([]);

  readonly usageCode = `import { NeuTableComponent } from '@neural-ui/core';

const columns: NeuTableColumn[] = [
  { key: 'id',   header: 'ID',   width: '60px', sortable: true },
  { key: 'name', header: 'Nombre', sortable: true },
  { key: 'role', header: 'Rol',   sortable: true },
];

// La URL cambia automáticamente:
// ?q=ana&sort=name&sortDir=asc&page=2
@Component({
  imports: [NeuTableComponent],
  template: \`
    <neu-table
      [columns]="columns"
      [data]="users"
      [pageSize]="10"
      [sortable]="true"
      [searchable]="true"
      [selectable]="true"
      (rowSelectionChange)="onSelect($event)"
    />
  \`
})
export class UsersComponent {
  users = inject(UserService).getAll();

  onSelect(rows: User[]) {
    console.log('filas seleccionadas:', rows);
  }
}`;
}
