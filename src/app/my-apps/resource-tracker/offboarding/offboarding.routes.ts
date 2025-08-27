import { Routes } from '@angular/router';
import { offboardingAccessGuard } from './offboarding-access.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./offboarding.component').then((c) => c.OffboardingComponent),
  },
  {
    path: ':parentTicketId/details',
    loadComponent: () =>
      import('./offboarding-details/offboarding-details.component').then(
        (c) => c.OffboardingDetailsComponent,
      ),
    canActivate: [offboardingAccessGuard],
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
