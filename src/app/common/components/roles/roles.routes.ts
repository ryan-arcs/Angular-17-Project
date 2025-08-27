// Routes configuration for role management components with lazy loading and access control
import { Routes } from '@angular/router';
import { roleAccessGuard } from './role-access.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./roles.component').then((c) => c.GlobalRolesComponent),
    canActivate: [roleAccessGuard],
  },
  {
    path: ':id/manage-permissions',
    loadComponent: () =>
      import('./manage-permissions/manage-permissions.component').then(
        (c) => c.ManagePermissionsComponent,
      ),
    canActivate: [roleAccessGuard],
  },
  {
    path: ':id/manage-users',
    loadComponent: () =>
      import('./manage-users/manage-users.component').then(
        (c) => c.ManageUsersComponent,
      ),
    canActivate: [roleAccessGuard],
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./add-edit-roles/add-edit-roles.component').then((c) => c.AddEditRolesComponent),
    canActivate: [roleAccessGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./add-edit-roles/add-edit-roles.component').then(
        (c) => c.AddEditRolesComponent,
      ),
    canActivate: [roleAccessGuard],
  },
  {
    path: '404',
    loadComponent: () =>
      import(
        'src/app/common/components/page-not-found/page-not-found.component'
      ).then((c) => c.PageNotFoundComponent),
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
