import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

import {
  NeuAccordionComponent,
  NeuAccordionItem,
  NeuAvatarComponent,
  NeuBadgeComponent,
  NeuBreadcrumbComponent,
  NeuBreadcrumbItem,
  NeuButtonComponent,
  NeuCardComponent,
  NeuChartComponent,
  NeuChartSeries,
  NeuCheckboxComponent,
  NeuChipComponent,
  NeuCodeBlockComponent,
  NeuDateInputComponent,
  NeuDialogComponent,
  NeuDividerComponent,
  NeuEmptyStateComponent,
  NeuIconComponent,
  NeuInputComponent,
  NeuMultiselectComponent,
  NeuNavComponent,
  NeuNavItem,
  NeuPaginationComponent,
  NeuProgressBarComponent,
  NeuRadioComponent,
  NeuRadioGroupComponent,
  NeuRatingComponent,
  NeuSelectComponent,
  NeuSelectOption,
  NeuSidebarComponent,
  NeuSkeletonComponent,
  NeuSliderComponent,
  NeuSplitButtonAction,
  NeuSplitButtonComponent,
  NeuStatsCardComponent,
  NeuStepperComponent,
  NeuStepperStep,
  NeuSwitchComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTableColumn,
  NeuTableComponent,
  NeuTabsComponent,
  NeuTextareaComponent,
  NeuTimelineComponent,
  NeuTimelineItem,
  NeuToastContainerComponent,
  NeuToastService,
  NeuToggleButtonGroupComponent,
  NeuToggleOption,
  NeuTooltipDirective,
  NeuUrlStateService,
} from '@neural-ui/core';

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterOutlet,
    NeuAccordionComponent,
    NeuAvatarComponent,
    NeuBadgeComponent,
    NeuBreadcrumbComponent,
    NeuButtonComponent,
    NeuCardComponent,
    NeuChartComponent,
    NeuCheckboxComponent,
    NeuChipComponent,
    NeuCodeBlockComponent,
    NeuDateInputComponent,
    NeuDialogComponent,
    NeuDividerComponent,
    NeuEmptyStateComponent,
    NeuIconComponent,
    NeuInputComponent,
    NeuMultiselectComponent,
    NeuNavComponent,
    NeuPaginationComponent,
    NeuProgressBarComponent,
    NeuRadioComponent,
    NeuRadioGroupComponent,
    NeuRatingComponent,
    NeuSelectComponent,
    NeuSidebarComponent,
    NeuSkeletonComponent,
    NeuSliderComponent,
    NeuSplitButtonComponent,
    NeuStatsCardComponent,
    NeuStepperComponent,
    NeuSwitchComponent,
    NeuTabPanelComponent,
    NeuTableComponent,
    NeuTabsComponent,
    NeuTextareaComponent,
    NeuTimelineComponent,
    NeuToastContainerComponent,
    NeuToggleButtonGroupComponent,
    NeuTooltipDirective,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly toastSvc = inject(NeuToastService);
  private readonly urlState = inject(NeuUrlStateService);

  // ─── Modal ───────────────────────────────────────────────────────────────
  readonly modalOpen = signal(false);

  // ─── Form controls (ControlValueAccessor) ────────────────────────────────
  readonly checkboxCtrl = new FormControl(false);
  readonly switchCtrl = new FormControl(false);
  readonly radioCtrl = new FormControl('b');
  readonly inputCtrl = new FormControl('Texto inicial');
  readonly textareaCtrl = new FormControl('');
  readonly selectCtrl = new FormControl('opt1');
  readonly multiselectCtrl = new FormControl<string[]>(['opt1']);
  readonly sliderCtrl = new FormControl(40);
  readonly dateCtrl = new FormControl('');
  readonly toggleCtrl = new FormControl('center');

  // ─── Signals independientes ───────────────────────────────────────────────
  readonly ratingValue = signal(3);
  readonly page = signal(1);
  readonly step = signal(0);
  readonly navCollapsed = signal(false);
  readonly chipSelected = signal(true);
  readonly progressValue = signal(65);

  // ─── Mock data ────────────────────────────────────────────────────────────

  readonly accordionItems: NeuAccordionItem[] = [
    {
      id: 'q1',
      title: '¿Qué es NeuralUI?',
      content: 'Una librería de componentes Angular con diseño Neural-Blue.',
      expanded: true,
    },
    {
      id: 'q2',
      title: '¿Requiere dependencias externas?',
      content: 'Solo @angular/cdk, @ng-icons y ng-apexcharts como peer deps.',
    },
    {
      id: 'q3',
      title: '¿Soporta dark mode?',
      content: 'Sí, mediante variables CSS y el atributo data-theme="dark".',
    },
  ];

  readonly breadcrumbs: NeuBreadcrumbItem[] = [
    { label: 'Inicio', route: '/' },
    { label: 'Sandbox', route: '/' },
    { label: 'Todos los componentes' },
  ];

  readonly selectOptions: NeuSelectOption[] = [
    { value: 'opt1', label: 'Opción 1' },
    { value: 'opt2', label: 'Opción 2' },
    { value: 'opt3', label: 'Opción 3 (deshabilitada)', disabled: true },
    { value: 'opt4', label: 'Opción 4', group: 'Grupo B' },
    { value: 'opt5', label: 'Opción 5', group: 'Grupo B' },
  ];

  readonly navItems: NeuNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'lucideLayoutDashboard', route: '/' },
    { id: 'users', label: 'Usuarios', icon: 'lucideUsers', route: '/' },
    {
      id: 'config',
      label: 'Configuración',
      icon: 'lucideSettings',
      children: [
        { id: 'profile', label: 'Perfil', icon: 'lucideUser', route: '/' },
        { id: 'account', label: 'Cuenta', icon: 'lucideMail', route: '/' },
      ],
    },
  ];

  readonly tableColumns: NeuTableColumn[] = [
    { key: 'id', header: 'ID', width: '60px' },
    { key: 'name', header: 'Nombre', sortable: true },
    {
      key: 'role',
      header: 'Rol',
      type: 'badge',
      badgeMap: {
        admin: { label: 'Admin', variant: 'danger' },
        user: { label: 'User', variant: 'info' },
      },
    },
    { key: 'email', header: 'Email' },
    {
      key: 'status',
      header: 'Estado',
      type: 'badge',
      badgeMap: {
        active: { label: 'Activo', variant: 'success' },
        inactive: { label: 'Inactivo', variant: 'default' },
      },
    },
  ];

  readonly tableData: Record<string, unknown>[] = [
    { id: 1, name: 'Alice Doe', role: 'admin', email: 'alice@example.com', status: 'active' },
    { id: 2, name: 'Bob Smith', role: 'user', email: 'bob@example.com', status: 'active' },
    { id: 3, name: 'Carol Jones', role: 'user', email: 'carol@example.com', status: 'inactive' },
    { id: 4, name: 'David Brown', role: 'admin', email: 'david@example.com', status: 'active' },
    { id: 5, name: 'Eve Wilson', role: 'user', email: 'eve@example.com', status: 'inactive' },
  ];

  readonly splitActions: NeuSplitButtonAction[] = [
    { id: 'save-copy', label: 'Guardar copia' },
    { id: 'export', label: 'Exportar' },
    { id: 'delete', label: 'Eliminar', divider: true },
  ];

  readonly toggleOptions: NeuToggleOption<string>[] = [
    { label: 'Izq', value: 'left', icon: 'lucideAlignLeft' },
    { label: 'Centro', value: 'center', icon: 'lucideAlignCenter' },
    { label: 'Dcha', value: 'right', icon: 'lucideAlignRight' },
  ];

  readonly stepperSteps: NeuStepperStep[] = [
    { label: 'Datos básicos', description: 'Nombre y email' },
    { label: 'Configuración', description: 'Preferencias' },
    { label: 'Confirmación', description: 'Revisar y enviar' },
  ];

  readonly timelineItems: NeuTimelineItem[] = [
    {
      time: 'Hace 2h',
      title: 'Usuario creado',
      description: 'alice@example.com se registró',
      variant: 'success',
    },
    { time: 'Hace 5h', title: 'Contraseña cambiada', variant: 'warning' },
    {
      time: 'Ayer',
      title: 'Login fallido',
      description: 'Intento desde IP desconocida',
      variant: 'danger',
    },
    { time: 'Hace 3 días', title: 'Perfil actualizado', variant: 'info' },
  ];

  readonly chartSeries: NeuChartSeries[] = [
    { name: 'Ventas', data: [30, 40, 35, 50, 49, 60, 70, 91] },
    { name: 'Gastos', data: [20, 25, 30, 28, 35, 40, 38, 50] },
  ];

  readonly chartCategories = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'];

  readonly demoTabs: NeuTab[] = [
    { id: 'tab1', label: 'Pestaña A' },
    { id: 'tab2', label: 'Pestaña B' },
    { id: 'tab3', label: 'Pestaña C (disabled)', disabled: true },
  ];

  readonly sampleCode = `import { NeuButtonComponent } from '@neural-ui/core';

@Component({
  imports: [NeuButtonComponent],
  template: \`<neu-button>Hola</neu-button>\`
})
export class MyComponent {}`;

  // ─── Events ───────────────────────────────────────────────────────────────

  log(source: string, payload?: unknown): void {
    if (payload !== undefined) {
      console.log(`[sandbox] ${source}`, payload);
    } else {
      console.log(`[sandbox] ${source} — disparado`);
    }
  }

  showToast(type: 'success' | 'error' | 'info' | 'warning'): void {
    const msgs: Record<string, string> = {
      success: 'Operación completada con éxito',
      error: 'Ha ocurrido un error inesperado',
      info: 'Esta es una notificación informativa',
      warning: 'Atención: revisa los datos',
    };
    this.toastSvc[type](msgs[type], {
      title: type.charAt(0).toUpperCase() + type.slice(1),
    });
    this.log(`toast.${type}`);
  }

  openSidebar(): void {
    this.urlState.setParam('drawer', 'open', false);
    this.log('sidebar.open');
  }

  prevStep(): void {
    this.step.update((s) => Math.max(0, s - 1));
    this.log('stepper.prev', this.step());
  }

  nextStep(): void {
    this.step.update((s) => Math.min(this.stepperSteps.length - 1, s + 1));
    this.log('stepper.next', this.step());
  }
}
