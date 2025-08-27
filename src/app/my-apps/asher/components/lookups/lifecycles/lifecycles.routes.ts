// Routes configuration for user management components with lazy loading and access control
import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lifecycles.component').then((c) => c.LifeCycleComponent),
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
