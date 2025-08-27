// Routes configuration for user management components with lazy loading and access control
import { Routes } from '@angular/router';
import { userAccessGuard } from './users-access.guard';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./users.component').then((c) => c.UsersComponent),
  },
  {
    path: ':id/manage-roles',
    loadComponent: () =>
      import('./manage-roles/manage-roles.component').then(
        (c) => c.ManageRolesComponent,
      ),
    canActivate: [userAccessGuard],
  },
  {
    path: ':id/special-permissions',
    loadComponent: () =>
      import('./manage-special-permissions/manage-special-permissions.component').then(
        (c) => c.ManageSpecialPermissionsComponent,
      ),
    canActivate: [userAccessGuard],
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./add-edit-user/add-edit-user.component').then(
        (c) => c.AddEditUserComponent,
      ),
    canActivate: [userAccessGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./add-edit-user/add-edit-user.component').then(
        (c) => c.AddEditUserComponent,
      ),
    canActivate: [userAccessGuard],
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
