// Application route definitions with lazy loading and access guards
import { Routes } from '@angular/router';
import { accessGuard } from './guards/access.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.routes').then((c) => c.routes),
    canActivate: [accessGuard],
  },
  {
    path: 'projects',
    loadChildren: () => import('./projects/projects.routes').then((c) => c.routes),
    canActivate: [accessGuard],
  },
  {
    path: 'recents',
    loadComponent: () => import('./recents/recents.component').then((c) => c.RecentsComponent),
    canActivate: [accessGuard],
  },
  {
    path: 'favorites',
    loadComponent: () => import('./favorites/favorites.component').then((c) => c.FavoritesComponent),
    canActivate: [accessGuard],
  },
  {
    path: 'roles',
    loadChildren: () => import('../../common/components/roles/roles.routes').then((c) => c.routes),
    data: {
      application: 'ubi',
      suppressedActions: ['add', 'edit', 'manage_permissions', 'delete']
    },
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
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];

