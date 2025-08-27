import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { accessGuard } from '../guards/access.guard';
import { applicationFrameGuard } from '../guards/application-frame.guard';

export const routes: Routes = [
  {
    path: 'projects',
    loadComponent: () =>
      import('./applications.component').then((c) => c.ApplicationsComponent),
    canActivate: [accessGuard],
  },
  {
    path: 'projects/:id',
    component: LayoutComponent,
    loadChildren: () => import('./layout/layout.routes').then((c) => c.routes),
    canActivate: [applicationFrameGuard],
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
    redirectTo: 'projects',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
