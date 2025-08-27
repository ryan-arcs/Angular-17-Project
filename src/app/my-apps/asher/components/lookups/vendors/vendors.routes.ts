// Routes configuration for user management components with lazy loading and access control
import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./vendors.component').then((c) => c.VendorsComponent),
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
