import { Routes } from '@angular/router';

export const routes: Routes = [
  // Inicio
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'NeuralUI — Sistema de Diseño Angular',
  },

  // Templates (vitrina de ventas)
  {
    path: 'templates',
    loadComponent: () =>
      import('./pages/templates/templates.component').then((m) => m.TemplatesComponent),
    title: 'Premium Templates — NeuralUI',
  },

  // Componentes — Form
  {
    path: 'components/input',
    loadComponent: () =>
      import('./pages/input-demo/input-demo.component').then((m) => m.InputDemoComponent),
    title: 'Input — NeuralUI',
  },
  {
    path: 'components/select',
    loadComponent: () =>
      import('./pages/select-demo/select-demo.component').then((m) => m.SelectDemoComponent),
    title: 'Select — NeuralUI',
  },
  {
    path: 'components/button',
    loadComponent: () =>
      import('./pages/button-demo/button-demo.component').then((m) => m.ButtonDemoComponent),
    title: 'Button — NeuralUI',
  },

  // Componentes — Data
  {
    path: 'components/table',
    loadComponent: () =>
      import('./pages/table-demo/table-demo.component').then((m) => m.TableDemoComponent),
    title: 'Table — NeuralUI',
  },
  {
    path: 'components/badge',
    loadComponent: () =>
      import('./pages/badge-demo/badge-demo.component').then((m) => m.BadgeDemoComponent),
    title: 'Badge — NeuralUI',
  },
  {
    path: 'components/card',
    loadComponent: () =>
      import('./pages/card-demo/card-demo.component').then((m) => m.CardDemoComponent),
    title: 'Card — NeuralUI',
  },

  // Componentes — Navigation
  {
    path: 'components/sidebar',
    loadComponent: () =>
      import('./pages/sidebar-demo/sidebar-demo.component').then((m) => m.SidebarDemoComponent),
    title: 'Sidebar — NeuralUI',
  },
  {
    path: 'components/avatar',
    loadComponent: () =>
      import('./pages/avatar-demo/avatar-demo.component').then((m) => m.AvatarDemoComponent),
    title: 'Avatar — NeuralUI',
  },

  // Componentes — Charts
  {
    path: 'components/chart',
    loadComponent: () =>
      import('./pages/chart-demo/chart-demo.component').then((m) => m.ChartDemoComponent),
    title: 'Chart — NeuralUI',
  },
  {
    path: 'components/stats-card',
    loadComponent: () =>
      import('./pages/stats-card-demo/stats-card-demo.component').then(
        (m) => m.StatsCardDemoComponent,
      ),
    title: 'Stats Card — NeuralUI',
  },

  // Componentes — Overlays
  {
    path: 'components/modal',
    loadComponent: () =>
      import('./pages/modal-demo/modal-demo.component').then((m) => m.ModalDemoComponent),
    title: 'Modal — NeuralUI',
  },
  {
    path: 'components/empty-state',
    loadComponent: () =>
      import('./pages/empty-state-demo/empty-state-demo.component').then(
        (m) => m.EmptyStateDemoComponent,
      ),
    title: 'Empty State — NeuralUI',
  },
  {
    path: 'components/feedback',
    loadComponent: () =>
      import('./pages/feedback-demo/feedback-demo.component').then((m) => m.FeedbackDemoComponent),
    title: 'Tooltip & Toast — NeuralUI',
  },
  {
    path: 'components/form',
    loadComponent: () =>
      import('./pages/form-demo/form-demo.component').then((m) => m.FormDemoComponent),
    title: 'Form Controls — NeuralUI',
  },

  // Fallback
  {
    path: '**',
    redirectTo: '',
  },
];
