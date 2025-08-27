import { Routes } from '@angular/router';
import { onboardingAccessGuard } from './onboarding-access.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./onboarding.component').then((c) => c.OnboardingComponent),
  },
  {
    path: ':parentTicketId/details',
    loadComponent: () =>
      import('./onboarding-details/onboarding-details.component').then(
        (c) => c.OnboardingDetailsComponent,
      ),
    canActivate: [onboardingAccessGuard],
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
