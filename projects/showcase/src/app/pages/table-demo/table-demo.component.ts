import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTableBadgeConfig,
  NeuTableColumn,
  NeuTableComponent,
  NeuTableExpandDirective,
  NeuTabsComponent,
} from '@neural-ui/core';

// ---- Interfaces ----
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  joined: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface Order {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'delivered' | 'processing' | 'cancelled' | 'pending';
  items: { product: string; qty: number; price: number }[];
}

const NAMES = [
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
];
const PRODUCTS_LIST = [
  'Laptop Pro 16"',
  'Monitor 4K 27"',
  'Teclado Mecánico',
  'Ratón Inalámbrico',
  'Auriculares BT',
  'Webcam HD',
  'Hub USB-C',
  'SSD 1TB',
  'RAM 32GB',
  'Mousepad XL',
];
const CATEGORIES = ['Portátiles', 'Monitores', 'Periféricos', 'Almacenamiento', 'Audio'];

@Component({
  selector: 'app-table-demo',
  imports: [
    TranslocoPipe,
    DecimalPipe,
    NeuTableComponent,
    NeuTableExpandDirective,
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
  private readonly _t = inject(TranslocoService);
  private readonly _translations = toSignal(this._t.selectTranslation());
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._translations();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'examples', label: this._t.translate('demo.common.tabs.examples') },
      { id: 'config', label: this._t.translate('demo.common.tabs.config') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  // ══════════════ DEMO 1: Usuarios (Preview principal) ══════════════
  readonly userColumns: NeuTableColumn[] = [
    { key: 'id', header: 'ID', width: '60px', align: 'center', sortable: true },
    { key: 'name', header: 'Nombre', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Rol', sortable: true },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      type: 'badge',
      badgeMap: {
        active: { label: 'Activo', variant: 'success' },
        inactive: { label: 'Inactivo', variant: 'default' },
        pending: { label: 'Pendiente', variant: 'warning' },
      } satisfies Record<string, NeuTableBadgeConfig>,
    },
    { key: 'joined', header: 'Alta', sortable: true },
  ];

  readonly userData: User[] = Array.from({ length: 47 }, (_, i) => ({
    id: i + 1,
    name: NAMES[i % 10],
    email: `user${i + 1}@neural.io`,
    role: ['Admin', 'Editor', 'Viewer', 'Developer', 'Manager'][i % 5],
    status: (['active', 'inactive', 'pending'] as const)[i % 3],
    joined: `${2020 + (i % 5)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  }));

  readonly selectedUsers = signal<User[]>([]);

  // ══════════════ DEMO 2: Productos (badges + CSV export) ══════════════
  readonly productColumns: NeuTableColumn[] = [
    { key: 'id', header: 'SKU', width: '70px', align: 'center', sortable: true },
    { key: 'name', header: 'Producto', sortable: true },
    { key: 'category', header: 'Categoría', sortable: true },
    {
      key: 'price',
      header: 'Precio',
      align: 'right',
      sortable: true,
      cell: (r) => `${(r as unknown as Product).price.toFixed(2)} €`,
    },
    { key: 'stock', header: 'Stock', align: 'center', sortable: true },
    {
      key: 'status',
      header: 'Disponibilidad',
      sortable: true,
      type: 'badge',
      badgeMap: {
        in_stock: { label: 'En stock', variant: 'success' },
        low_stock: { label: 'Bajo', variant: 'warning' },
        out_of_stock: { label: 'Agotado', variant: 'danger' },
      } satisfies Record<string, NeuTableBadgeConfig>,
    },
  ];

  readonly productData: Product[] = Array.from({ length: 30 }, (_, i) => ({
    id: 1000 + i + 1,
    name: PRODUCTS_LIST[i % 10],
    category: CATEGORIES[i % 5],
    price: +(Math.random() * 1000 + 10).toFixed(2),
    stock: Math.floor(Math.random() * 200),
    status: (['in_stock', 'in_stock', 'low_stock', 'out_of_stock'] as const)[i % 4],
  }));

  // ══════════════ DEMO 3: Pedidos (row expansion) ══════════════
  readonly orderColumns: NeuTableColumn[] = [
    { key: 'id', header: 'Pedido', width: '100px', sortable: true },
    { key: 'customer', header: 'Cliente', sortable: true },
    { key: 'date', header: 'Fecha', sortable: true },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      sortable: true,
      cell: (r) => `${(r as unknown as Order).total.toFixed(2)} €`,
    },
    {
      key: 'status',
      header: 'Estado',
      type: 'badge',
      badgeMap: {
        delivered: { label: 'Entregado', variant: 'success' },
        processing: { label: 'En proceso', variant: 'info' },
        cancelled: { label: 'Cancelado', variant: 'danger' },
        pending: { label: 'Pendiente', variant: 'warning' },
      } satisfies Record<string, NeuTableBadgeConfig>,
    },
  ];

  readonly orderData: Order[] = Array.from({ length: 15 }, (_, i) => ({
    id: `#ORD-${String(2400 + i + 1).padStart(5, '0')}`,
    customer: NAMES[i % 10],
    date: `2026-0${(i % 3) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
    total: +(Math.random() * 800 + 20).toFixed(2),
    status: (['delivered', 'processing', 'cancelled', 'pending'] as const)[i % 4],
    items: [
      {
        product: PRODUCTS_LIST[i % 10],
        qty: (i % 3) + 1,
        price: +(Math.random() * 200 + 10).toFixed(2),
      },
      {
        product: PRODUCTS_LIST[(i + 3) % 10],
        qty: 1,
        price: +(Math.random() * 100 + 5).toFixed(2),
      },
    ],
  }));

  // ══════════════ DEMO 4: Sticky header ══════════════
  readonly simpleColumns: NeuTableColumn[] = [
    { key: 'id', header: '#', width: '50px', align: 'center' },
    { key: 'name', header: 'Nombre', sortable: true },
    { key: 'dept', header: 'Depto.', sortable: true },
    { key: 'city', header: 'Ciudad' },
  ];

  readonly simpleData = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    name: NAMES[i % 10],
    dept: ['Ingeniería', 'Producto', 'Marketing', 'Ventas', 'Soporte'][i % 5],
    city: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'][i % 5],
  }));

  readonly stickyCode = `
const columns: NeuTableColumn[] = [
  { key: 'id', header: '#', width: '50px', align: 'center' },
  { key: 'name', header: 'Nombre', sortable: true },
  { key: 'dept', header: 'Depto.', sortable: true },
  { key: 'city', header: 'Ciudad' },
];

const data = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  name: names[i % 10],
  dept: ['Ingeniería', 'Producto', 'Marketing', 'Ventas', 'Soporte'][i % 5],
  city: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'][i % 5],
}));
`.trim();

  // ══════════════ DEMO 5: Custom header templates ══════════════
  readonly _customStatusHeaderTpl = viewChild<TemplateRef<unknown>>('customStatusHeader');

  readonly customHeaderColumns = computed<NeuTableColumn[]>(() => {
    const tpl = this._customStatusHeaderTpl();
    return [
      { key: 'id', header: '#', width: '50px', align: 'center' },
      { key: 'name', header: 'Nombre', sortable: true },
      { key: 'email', header: 'Email' },
      {
        key: 'status',
        header: 'Estado',
        headerTemplate: tpl,
        sortable: true,
        type: 'badge',
        badgeMap: {
          active: { label: 'Activo', variant: 'success' },
          inactive: { label: 'Inactivo', variant: 'danger' },
          pending: { label: 'Pendiente', variant: 'warning' },
        },
      },
    ];
  });

  // ══════════════ Configurador ══════════════
  cfg = {
    searchable: true,
    sortable: true,
    selectable: false,
    expandable: false,
    exportable: false,
    stickyHeader: false,
    pageSize: 10,
    exactMatchable: false,
    searchPlaceholder: 'Search...',
  };

  get configCode(): string {
    const attrs: string[] = [`[columns]="columns"`, `[data]="data"`];
    if (this.cfg.searchable) attrs.push(`[searchable]="true"`);
    if (this.cfg.sortable) attrs.push(`[sortable]="true"`);
    if (this.cfg.selectable) attrs.push(`[selectable]="true"`);
    if (this.cfg.expandable) attrs.push(`[expandable]="true"`);
    if (this.cfg.exportable) attrs.push(`[exportable]="true"\n  exportFileName="mi-export"`);
    if (this.cfg.stickyHeader) attrs.push(`[stickyHeader]="true"`);
    attrs.push(`[pageSize]="${this.cfg.pageSize}"`);
    if (this.cfg.exactMatchable) attrs.push(`[exactMatchable]="true"`);
    if (this.cfg.searchPlaceholder !== 'Search...')
      attrs.push(`searchPlaceholder="${this.cfg.searchPlaceholder}"`);
    return `<neu-table\n  ${attrs.join('\n  ')}\n/>`;
  }

  readonly cfgSelectedRows = signal<User[]>([]);

  // ══════════════ Usage code snippets ══════════════
  readonly usageCode = `import { NeuTableComponent, NeuTableExpandDirective } from '@neural-ui/core';

const columns: NeuTableColumn[] = [
  { key: 'id',     header: 'ID',   width: '60px', sortable: true },
  { key: 'name',   header: 'Nombre', sortable: true },
  { key: 'status', header: 'Estado', type: 'badge',
    badgeMap: {
      active:   { label: 'Activo',   variant: 'success' },
      inactive: { label: 'Inactivo', variant: 'default' },
    }
  },
];

// La URL cambia automáticamente:
// ?q=ana&sort=name&sortDir=asc&page=2
@Component({
  imports: [NeuTableComponent, NeuTableExpandDirective],
  template: \`
    <neu-table
      title="Usuarios"
      [columns]="columns"
      [data]="users"
      [pageSize]="10"
      [pageSizeOptions]="[5,10,25,50]"
      [sortable]="true"
      [searchable]="true"
      [selectable]="true"
      [exportable]="true"
      exportFileName="usuarios"
      [expandable]="true"
      (rowSelectionChange)="onSelect(\$event)"
    >
      <ng-template neuTableExpand let-row>
        <p>Detalle de {{ row.name }}</p>
      </ng-template>
    </neu-table>
  \`
})
export class UsersComponent {
  users = inject(UserService).getAll();
  onSelect(rows: User[]) { console.log(rows); }
}`;

  readonly badgeCode = `const columns: NeuTableColumn[] = [
  {
    key: 'status',
    header: 'Estado',
    type: 'badge',
    badgeMap: {
      active:   { label: 'Activo',   variant: 'success' },
      inactive: { label: 'Inactivo', variant: 'default' },
      pending:  { label: 'Pendiente', variant: 'warning' },
    },
  },
];`;

  readonly expandCode = `<neu-table [columns]="cols" [data]="orders" [expandable]="true">
  <ng-template neuTableExpand let-row>
    <table class="expand-items">
      @for (item of row.items; track item.product) {
        <tr>
          <td>{{ item.product }}</td>
          <td>x{{ item.qty }}</td>
          <td>{{ item.price | currency:'EUR' }}</td>
        </tr>
      }
    </table>
  </ng-template>
</neu-table>`;

  readonly exportCode = `<neu-table
  [exportable]="true"
  exportFileName="productos"
  [pageSizeOptions]="[10, 25, 50, 100]"
  ...
/>`;

  readonly headerTemplateCode = `import { NeuTableComponent, NeuTableColumn } from '@neural-ui/core';
import { TemplateRef, viewChild } from '@angular/core';

@Component({
  imports: [NeuTableComponent],
  template: \`
    <neu-table
      title="Cabeceras personalizadas"
      [columns]="customColumns()"
      [data]="data"
      [sortable]="true"
    />

    <!-- Plantilla personalizada para la cabecera de Estado -->
    <ng-template #statusHeaderTpl let-col>
      <span style="display: flex; align-items: center; gap: 6px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Estado
      </span>
    </ng-template>
  \`,
})
export class MyComponent {
  private statusHeaderTpl = viewChild<TemplateRef<unknown>>('statusHeaderTpl');

  readonly customColumns = computed<NeuTableColumn[]>(() => [
    { key: 'id',     header: '#',      width: '50px' },
    { key: 'name',   header: 'Nombre', sortable: true },
    { key: 'email',  header: 'Email' },
    {
      key: 'status',
      header: 'Estado',
      headerTemplate: this.statusHeaderTpl(),
      sortable: true,
      type: 'badge',
      badgeMap: {
        active:  { label: 'Activo',    variant: 'success' },
        inactive:{ label: 'Inactivo',  variant: 'danger'  },
        pending: { label: 'Pendiente', variant: 'warning' },
      },
    },
  ]);
}`;
}
