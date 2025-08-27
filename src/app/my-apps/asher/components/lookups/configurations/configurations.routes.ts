// Routes configuration for user management components with lazy loading and access control
import { Routes } from '@angular/router';
import { configurationAccessGuard } from './configuration-access.guard';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./configurations.component').then((c) => c.ConfigurationsComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./add-edit-configuration/add-edit-configuration.component').then(
        (c) => c.AddEditConfigurationComponent,
      ),
    canActivate: [configurationAccessGuard],
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
