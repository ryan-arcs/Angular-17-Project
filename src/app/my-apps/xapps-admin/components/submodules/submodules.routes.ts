// Routes configuration for user management components with lazy loading and access control
import { Routes } from '@angular/router';
import { submoduleAccessGuard } from './submodules-access.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./submodules.component').then((c) => c.SubmodulesComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./add-edit-submodules/add-edit-submodules.component').then(
        (c) => c.AddEditSubmodulesComponent,
      ),
    canActivate: [submoduleAccessGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./add-edit-submodules/add-edit-submodules.component').then(
        (c) => c.AddEditSubmodulesComponent,
      ),
    canActivate: [submoduleAccessGuard],
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
