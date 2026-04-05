import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'NeuralUI — Sistema de Diseño Angular',
  },
  {
    path: 'components/badge',
    loadComponent: () =>
      import('./pages/badge-demo/badge-demo.component').then((m) => m.BadgeDemoComponent),
    title: 'Badge — NeuralUI',
  },
  {
    path: 'components/button',
    loadComponent: () =>
      import('./pages/button-demo/button-demo.component').then((m) => m.ButtonDemoComponent),
    title: 'Button — NeuralUI',
  },
  {
    path: 'components/card',
    loadComponent: () =>
      import('./pages/card-demo/card-demo.component').then((m) => m.CardDemoComponent),
    title: 'Card — NeuralUI',
  },
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
    path: 'components/sidebar',
    loadComponent: () =>
      import('./pages/sidebar-demo/sidebar-demo.component').then((m) => m.SidebarDemoComponent),
    title: 'Sidebar — NeuralUI',
  },
  {
    path: 'components/table',
    loadComponent: () =>
      import('./pages/table-demo/table-demo.component').then((m) => m.TableDemoComponent),
    title: 'Table — NeuralUI',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
