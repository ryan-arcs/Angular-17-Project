// Application route definitions with lazy loading and access guards
import { Routes } from '@angular/router';
import { accessGuard } from './guards/access.guard';

export const routes: Routes = [
  {
    path: 'onboarding',
    loadChildren: () =>
      import('./onboarding/onboarding.routes').then((c) => c.routes),
    canActivate: [accessGuard],
  },
  {
    path: 'offboarding',
    loadChildren: () =>
      import('./offboarding/offboarding.routes').then((c) => c.routes),
    canActivate: [accessGuard],
  },
  {
    path: '404',
    loadComponent: () =>
      import(
        'src/app/common/components/page-not-found/page-not-found.component'
      ).then((c) => c.PageNotFoundComponent),
  },
  {
    path: '',
    redirectTo: 'onboarding',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
