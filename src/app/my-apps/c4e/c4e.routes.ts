import { Routes } from '@angular/router';
import { C4eAccessGuard } from './guards/access.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./listing/listing.routes').then((c) => c.routes),
    canActivate: [C4eAccessGuard],
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
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
