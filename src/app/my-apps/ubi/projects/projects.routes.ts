// Define application routes with lazy loading and access guards
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./projects.component').then((c) => c.ProjectsComponent),
  },
  {
    path: ':projectId/views',
    loadChildren: () => import('./views/views.routes').then((c) => c.routes),
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
