import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  NeuBadgeComponent,
  NeuBadgeVariant,
  NeuIconComponent,
  NeuSkeletonComponent,
  NeuTableColumn,
  NeuTooltipDirective,
  NeuUrlStateService,
} from '@neural-ui/core';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'banned' | 'pending';
  joined: string;
}

const ALL_USERS: AdminUser[] = [
  {
    id: 1,
    name: 'María García',
    email: 'maria@example.com',
    role: 'Admin',
    status: 'active',
    joined: '01/01/2024',
  },
  {
    id: 2,
    name: 'Carlos López',
    email: 'carlos@example.com',
    role: 'Editor',
    status: 'active',
    joined: '15/02/2024',
  },
  {
    id: 3,
    name: 'Ana Martínez',
    email: 'ana@example.com',
    role: 'Viewer',
    status: 'pending',
    joined: '20/03/2024',
  },
  {
    id: 4,
    name: 'Pedro Sánchez',
    email: 'pedro@example.com',
    role: 'Editor',
    status: 'banned',
    joined: '05/04/2024',
  },
  {
    id: 5,
    name: 'Laura Fernández',
    email: 'laura@example.com',
    role: 'Viewer',
    status: 'active',
    joined: '10/04/2024',
  },
  {
    id: 6,
    name: 'Javier Ruiz',
    email: 'javier@example.com',
    role: 'Editor',
    status: 'active',
    joined: '22/04/2024',
  },
  {
    id: 7,
    name: 'Sofía Torres',
    email: 'sofia@example.com',
    role: 'Viewer',
    status: 'pending',
    joined: '01/05/2024',
  },
  {
    id: 8,
    name: 'Luis Morales',
    email: 'luis@example.com',
    role: 'Admin',
    status: 'active',
    joined: '15/05/2024',
  },
  {
    id: 9,
    name: 'Carmen Díaz',
    email: 'carmen@example.com',
    role: 'Editor',
    status: 'banned',
    joined: '03/06/2024',
  },
  {
    id: 10,
    name: 'Diego Herrera',
    email: 'diego@example.com',
    role: 'Viewer',
    status: 'active',
    joined: '20/06/2024',
  },
];

const STATUS_VARIANT: Record<AdminUser['status'], NeuBadgeVariant> = {
  active: 'success',
  banned: 'danger',
  pending: 'warning',
};

@Component({
  selector: 'app-users',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuIconComponent,
    NeuTooltipDirective,
    NeuSkeletonComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  private readonly urlState = inject(NeuUrlStateService);
  readonly loading = signal(true);

  // URL-synced search param
  readonly searchParam = this.urlState.getParam('search');

  readonly filteredUsers = computed(() => {
    const q = (this.searchParam() ?? '').toLowerCase();
    if (!q) return ALL_USERS;
    return ALL_USERS.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  });

  readonly columns: NeuTableColumn<AdminUser>[] = [
    { key: 'id', header: 'ID', width: '60px' },
    { key: 'name', header: 'Nombre', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Rol' },
    { key: 'status', header: 'Estado' },
    { key: 'joined', header: 'Alta', align: 'right' },
  ];

  getStatusVariant(status: AdminUser['status']): NeuBadgeVariant {
    return STATUS_VARIANT[status];
  }

  getStatusLabel(status: AdminUser['status'], pipe: TranslocoPipe): string {
    return pipe.transform(`users.status.${status}`);
  }

  ngOnInit(): void {
    setTimeout(() => this.loading.set(false), 1200);
  }

  onSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value.trim();
    if (q) {
      this.urlState.setParam('search', q, false);
    } else {
      this.urlState.setParam('search', null, false);
    }
  }
}
