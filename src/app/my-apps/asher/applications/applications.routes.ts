// Routes configuration for user management components with lazy loading and access control
import { Routes } from '@angular/router';
import { asherAccessGuard } from './applications-access.guard';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./applications.component').then((c) => c.ApplicationsComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./add-edit-asher/add-edit-asher.component').then(
        (c) => c.AddEditAsherComponent,
      ),
    canActivate: [asherAccessGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./add-edit-asher/add-edit-asher.component').then(
        (c) => c.AddEditAsherComponent,
      ),
    canActivate: [asherAccessGuard],
  },
  {
    path: ':id/application-details',
    loadComponent: () =>
      import('./application-details/application-details.component').then(
        (c) => c.ApplicationDetailsComponent,
      ),
    canActivate: [asherAccessGuard],
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
