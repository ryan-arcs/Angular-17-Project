import { Routes } from '@angular/router';
import { C4eAccessGuard } from '../guards/access.guard';
//no need of this file now

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
    import('./listing.component').then((c) => c.ListingComponent),
    canActivate: [C4eAccessGuard],
  },
  {
    path: 'list/:tableName',
    loadComponent: () =>
      import('./listing.component').then((c) => c.ListingComponent),
      canActivate: [C4eAccessGuard],
  },
  {
      path: '',
      redirectTo: 'list',
      pathMatch: 'full',
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
