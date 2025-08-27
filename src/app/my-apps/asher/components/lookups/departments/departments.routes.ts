// Routes configuration for user management components with lazy loading and access control
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./departments.component').then((c) => c.DepartmentsComponent),
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
