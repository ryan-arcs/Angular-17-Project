// Define application routes with lazy loading and access guards
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home.component').then((c) => c.HomeComponent),
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
