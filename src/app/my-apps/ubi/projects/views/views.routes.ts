// Define application routes with lazy loading and access guards
import { Routes } from '@angular/router';
import { viewAccessGuard } from '../../guards/view-access.guard';

export const routes: Routes = [
  {
    path: ':id/:loadedFrom/:selectedViews',
    loadComponent: () =>
      import('./view/view.component').then((c) => c.ViewComponent),
    canActivate: [viewAccessGuard]
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
