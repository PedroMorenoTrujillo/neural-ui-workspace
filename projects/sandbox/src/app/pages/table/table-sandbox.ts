import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuTableComponent } from '@neural-ui/core';
import type { NeuTableColumn } from '@neural-ui/core';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  age: number;
}

const USERS: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Usuario ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'Viewer',
  status: i % 4 === 0 ? 'Inactivo' : 'Activo',
  age: 20 + (i % 40),
}));

const COLUMNS: NeuTableColumn[] = [
  { key: 'id', header: 'ID', sortable: true, width: '60px' },
  { key: 'name', header: 'Nombre', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Rol', sortable: true, width: '100px' },
  { key: 'status', header: 'Estado', width: '100px' },
  { key: 'age', header: 'Edad', sortable: true, width: '80px' },
];

@Component({
  selector: 'app-table-sandbox',
  imports: [NeuTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Table</h1>
        <p class="sb-page__desc">
          NeuTableComponent — búsqueda, ordenación, selección, exportación, URL state.
        </p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico (50 filas, paginado)</h2>
        <neu-table
          title="Usuarios"
          [columns]="columns"
          [data]="users"
          [pageSize]="10"
          [searchable]="true"
        />
      </section>

      <!-- Sortable + exportable -->
      <section class="sb-section">
        <h2 class="sb-section__title">Sortable + exportable + URL state</h2>
        <neu-table
          title="Usuarios con URL state"
          [columns]="columns"
          [data]="users"
          [pageSize]="5"
          [sortable]="true"
          [exportable]="true"
          exportFileName="usuarios"
          pageParam="p"
          searchParam="q"
          sortParam="s"
          sortDirParam="d"
        />
      </section>

      <!-- Selectable -->
      <section class="sb-section">
        <h2 class="sb-section__title">Filas seleccionables</h2>
        <neu-table
          title="Selección de usuarios"
          [columns]="columns"
          [data]="users"
          [pageSize]="5"
          [selectable]="true"
          (rowSelectionChange)="selected.set($event.length)"
        />
        <span class="sb-value">filas seleccionadas: {{ selected() }}</span>
      </section>

      <!-- Loading / Vacío -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <div>
            <p class="sb-label" style="margin-bottom: 8px">Loading skeleton</p>
            <neu-table [columns]="columns" [data]="[]" [loading]="true" />
          </div>
          <div style="margin-top: 1rem">
            <p class="sb-label" style="margin-bottom: 8px">Sin datos</p>
            <neu-table [columns]="columns" [data]="[]" emptyMessage="No se encontraron usuarios" />
          </div>
        </div>
      </section>
    </div>
  `,
})
export class TableSandboxComponent {
  readonly columns = COLUMNS;
  readonly users = USERS;
  readonly selected = signal(0);
}
