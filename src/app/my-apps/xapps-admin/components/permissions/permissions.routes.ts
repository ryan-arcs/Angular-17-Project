// Routes configuration for user management components with lazy loading and access control
import { Routes } from '@angular/router';
import { permissionAccessGuard } from './permissions-access.guard';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./permissions.component').then((c) => c.PermissionsComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./add-edit-permissions/add-edit-permissions.component').then(
        (c) => c.AddEditPermissionsComponent,
      ),
    canActivate: [permissionAccessGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./add-edit-permissions/add-edit-permissions.component').then(
        (c) => c.AddEditPermissionsComponent,
      ),
    canActivate: [permissionAccessGuard],
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
