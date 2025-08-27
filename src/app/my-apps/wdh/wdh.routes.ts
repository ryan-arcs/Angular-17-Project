import { Routes } from '@angular/router';
import { AccessGuard } from './guards/access.guard';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./listing/listing.component').then((c) => c.ListingComponent),
    canActivate: [AccessGuard],
  },
  {
    path: 'list/:tableName',
    loadComponent: () =>
      import('./listing/listing.component').then((c) => c.ListingComponent),
    canActivate: [AccessGuard],
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
