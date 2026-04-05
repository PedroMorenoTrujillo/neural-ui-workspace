import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'NeuralUI — Suite de Componentes Angular',
  },
  {
    path: 'components/button',
    loadComponent: () =>
      import('./pages/button-demo/button-demo.component').then((m) => m.ButtonDemoComponent),
    title: 'NeuralUI — Button',
  },
  {
    path: 'components/sidebar',
    loadComponent: () =>
      import('./pages/sidebar-demo/sidebar-demo.component').then((m) => m.SidebarDemoComponent),
    title: 'NeuralUI — Sidebar',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
