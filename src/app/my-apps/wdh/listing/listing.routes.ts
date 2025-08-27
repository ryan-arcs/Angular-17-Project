import { Routes } from '@angular/router';
//no need of this file now

export const routes: Routes = [
  {
    path: '/:tableName',
    loadComponent: () =>
      import('./listing.component').then((c) => c.ListingComponent),
  },
  {
    path: 'list/:tableName',
    loadComponent: () =>
      import('./listing.component').then((c) => c.ListingComponent),
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
