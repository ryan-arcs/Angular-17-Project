/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';
import { ResourceTrackerGlobalDataService } from '../services/resource-tracker-global-data.service';

export const accessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'onboarding';

  const isPermitted = authService.hasPermissionToAccessModule({
    appSlug: 'resource_tracker',
    moduleSlug: path.toLowerCase().replace(/[- ]/g, '_'),
    permissionSlug: 'view',
    parentRoutePath: '/my-apps',
  });

  if (isPermitted) {

    const resourceTrackerGlobalDataService = inject(ResourceTrackerGlobalDataService);

    switch (path) {
      case 'onboarding':
        if (resourceTrackerGlobalDataService.reloadData('onboarding')) {
          await resourceTrackerGlobalDataService.getOnboardingParentTickets();
          await resourceTrackerGlobalDataService.onboardingRowCountByStatus();
        }

        break;
      case 'offboarding':
        if (resourceTrackerGlobalDataService.reloadData('offboarding')) {
          await resourceTrackerGlobalDataService.getOffboardingParentTickets();
          await resourceTrackerGlobalDataService.offboardingRowCountByStatus();
        }

        break;
    }
  }

  return isPermitted;
};
