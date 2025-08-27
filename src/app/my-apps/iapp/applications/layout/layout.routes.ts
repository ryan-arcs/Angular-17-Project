import { Routes } from '@angular/router';
import { accessGuard } from '../../guards/access.guard';
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (c) => c.DashboardComponent,
      ),
    canActivate: [accessGuard],
  },
  {
    path: 'logs',
    loadComponent: () =>
      import('./logs/logs.component').then((c) => c.LogsComponent),
    canActivate: [accessGuard],
  },
  {
    path: 'schedules',
    loadComponent: () =>
      import('./scheduler/scheduler.component').then(
        (c) => c.SchedulerComponent,
      ),
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
    path: '**',
    redirectTo: '/404',
  },
];
