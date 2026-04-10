import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'button',
    pathMatch: 'full',
  },
  // ── Formularios ───────────────────────────────────────────────
  {
    path: 'input',
    loadComponent: () => import('./pages/input/input-sandbox').then((m) => m.InputSandboxComponent),
  },
  {
    path: 'select',
    loadComponent: () =>
      import('./pages/select/select-sandbox').then((m) => m.SelectSandboxComponent),
  },
  {
    path: 'multiselect',
    loadComponent: () =>
      import('./pages/multiselect/multiselect-sandbox').then((m) => m.MultiselectSandboxComponent),
  },
  {
    path: 'textarea',
    loadComponent: () =>
      import('./pages/textarea/textarea-sandbox').then((m) => m.TextareaSandboxComponent),
  },
  {
    path: 'checkbox',
    loadComponent: () =>
      import('./pages/checkbox/checkbox-sandbox').then((m) => m.CheckboxSandboxComponent),
  },
  {
    path: 'radio',
    loadComponent: () => import('./pages/radio/radio-sandbox').then((m) => m.RadioSandboxComponent),
  },
  {
    path: 'switch',
    loadComponent: () =>
      import('./pages/switch/switch-sandbox').then((m) => m.SwitchSandboxComponent),
  },
  {
    path: 'date-input',
    loadComponent: () =>
      import('./pages/date-input/date-input-sandbox').then((m) => m.DateInputSandboxComponent),
  },
  {
    path: 'slider',
    loadComponent: () =>
      import('./pages/slider/slider-sandbox').then((m) => m.SliderSandboxComponent),
  },
  {
    path: 'rating',
    loadComponent: () =>
      import('./pages/rating/rating-sandbox').then((m) => m.RatingSandboxComponent),
  },
  {
    path: 'toggle-button-group',
    loadComponent: () =>
      import('./pages/toggle-button-group/toggle-button-group-sandbox').then(
        (m) => m.ToggleButtonGroupSandboxComponent,
      ),
  },
  // ── Acciones ──────────────────────────────────────────────────
  {
    path: 'button',
    loadComponent: () =>
      import('./pages/button/button-sandbox').then((m) => m.ButtonSandboxComponent),
  },
  {
    path: 'split-button',
    loadComponent: () =>
      import('./pages/split-button/split-button-sandbox').then(
        (m) => m.SplitButtonSandboxComponent,
      ),
  },
  // ── Datos ─────────────────────────────────────────────────────
  {
    path: 'table',
    loadComponent: () => import('./pages/table/table-sandbox').then((m) => m.TableSandboxComponent),
  },
  {
    path: 'badge',
    loadComponent: () => import('./pages/badge/badge-sandbox').then((m) => m.BadgeSandboxComponent),
  },
  {
    path: 'chip',
    loadComponent: () => import('./pages/chip/chip-sandbox').then((m) => m.ChipSandboxComponent),
  },
  {
    path: 'stats-card',
    loadComponent: () =>
      import('./pages/stats-card/stats-card-sandbox').then((m) => m.StatsCardSandboxComponent),
  },
  {
    path: 'progress-bar',
    loadComponent: () =>
      import('./pages/progress-bar/progress-bar-sandbox').then(
        (m) => m.ProgressBarSandboxComponent,
      ),
  },
  {
    path: 'pagination',
    loadComponent: () =>
      import('./pages/pagination/pagination-sandbox').then((m) => m.PaginationSandboxComponent),
  },
  // ── Navegación ────────────────────────────────────────────────
  {
    path: 'sidebar',
    loadComponent: () =>
      import('./pages/sidebar/sidebar-sandbox').then((m) => m.SidebarSandboxComponent),
  },
  {
    path: 'nav',
    loadComponent: () => import('./pages/nav/nav-sandbox').then((m) => m.NavSandboxComponent),
  },
  {
    path: 'breadcrumb',
    loadComponent: () =>
      import('./pages/breadcrumb/breadcrumb-sandbox').then((m) => m.BreadcrumbSandboxComponent),
  },
  {
    path: 'stepper',
    loadComponent: () =>
      import('./pages/stepper/stepper-sandbox').then((m) => m.StepperSandboxComponent),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs-sandbox').then((m) => m.TabsSandboxComponent),
  },
  // ── Layout ────────────────────────────────────────────────────
  {
    path: 'accordion',
    loadComponent: () =>
      import('./pages/accordion/accordion-sandbox').then((m) => m.AccordionSandboxComponent),
  },
  {
    path: 'card',
    loadComponent: () => import('./pages/card/card-sandbox').then((m) => m.CardSandboxComponent),
  },
  {
    path: 'divider',
    loadComponent: () =>
      import('./pages/divider/divider-sandbox').then((m) => m.DividerSandboxComponent),
  },
  {
    path: 'modal',
    loadComponent: () => import('./pages/modal/modal-sandbox').then((m) => m.ModalSandboxComponent),
  },
  // ── Feedback ─────────────────────────────────────────────────
  {
    path: 'toast',
    loadComponent: () => import('./pages/toast/toast-sandbox').then((m) => m.ToastSandboxComponent),
  },
  {
    path: 'spinner',
    loadComponent: () =>
      import('./pages/spinner/spinner-sandbox').then((m) => m.SpinnerSandboxComponent),
  },
  {
    path: 'skeleton',
    loadComponent: () =>
      import('./pages/skeleton/skeleton-sandbox').then((m) => m.SkeletonSandboxComponent),
  },
  {
    path: 'empty-state',
    loadComponent: () =>
      import('./pages/empty-state/empty-state-sandbox').then((m) => m.EmptyStateSandboxComponent),
  },
  {
    path: 'timeline',
    loadComponent: () =>
      import('./pages/timeline/timeline-sandbox').then((m) => m.TimelineSandboxComponent),
  },
  // ── Overlays ─────────────────────────────────────────────────
  {
    path: 'tooltip',
    loadComponent: () =>
      import('./pages/tooltip/tooltip-sandbox').then((m) => m.TooltipSandboxComponent),
  },
  // ── Media ─────────────────────────────────────────────────────
  {
    path: 'avatar',
    loadComponent: () =>
      import('./pages/avatar/avatar-sandbox').then((m) => m.AvatarSandboxComponent),
  },
  {
    path: 'icon',
    loadComponent: () => import('./pages/icon/icon-sandbox').then((m) => m.IconSandboxComponent),
  },
  {
    path: 'code-block',
    loadComponent: () =>
      import('./pages/code-block/code-block-sandbox').then((m) => m.CodeBlockSandboxComponent),
  },
  {
    path: 'chart',
    loadComponent: () => import('./pages/chart/chart-sandbox').then((m) => m.ChartSandboxComponent),
  },
  // ── Utilidades ────────────────────────────────────────────────
  {
    path: 'url-state',
    loadComponent: () =>
      import('./pages/url-state/url-state-sandbox').then((m) => m.UrlStateSandboxComponent),
  },
];
