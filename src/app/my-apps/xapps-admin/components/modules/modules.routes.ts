// Routes configuration for user management components with lazy loading and access control
import { Routes } from '@angular/router';
import { moduleAccessGuard } from './modules-access.guard';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./modules.component').then((c) => c.ModulesComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./add-edit-modules/add-edit-modules.component').then(
        (c) => c.AddEditModulesComponent,
      ),
    canActivate: [moduleAccessGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./add-edit-modules/add-edit-modules.component').then(
        (c) => c.AddEditModulesComponent,
      ),
    canActivate: [moduleAccessGuard],
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
