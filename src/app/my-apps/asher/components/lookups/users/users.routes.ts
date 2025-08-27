// Routes configuration for user management components with lazy loading and access control
import { Routes } from '@angular/router';
import { userAccessGuard } from './users-access.guard';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./users.component').then((c) => c.UsersComponent),
  },
  {
    path: ':email/user-details',
    loadComponent: () =>
      import('../users/user-details/user-details.component').then((c) => c.UserDetailsComponent),
    canActivate: [userAccessGuard]
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
