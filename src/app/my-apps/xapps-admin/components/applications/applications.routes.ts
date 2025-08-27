// Routes configuration for user management components with lazy loading and access control
import { Routes } from '@angular/router';
import { applicationAccessGuard } from './applications-access.guard'
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./applications.component').then((c) => c.ApplicationsComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./add-edit-applications/add-edit-applications.component').then(
        (c) => c.AddEditApplicationsComponent,
      ),
    canActivate: [applicationAccessGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./add-edit-applications/add-edit-applications.component').then(
        (c) => c.AddEditApplicationsComponent,
      ),
    canActivate: [applicationAccessGuard],
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
