/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';
import { ResourceTrackerGlobalDataService } from '../services/resource-tracker-global-data.service';

export const onboardingAccessGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'onboarding';

  const parentRoutePath = '/resource-tracker/onboarding';

  switch (path) {
    case ':parentTicketId/details':
      const isPermitted = authService.hasPermissionToAccessModule({
        appSlug: 'resource_tracker',
        moduleSlug: 'onboarding',
        permissionSlug: 'view',
        parentRoutePath,
      });

      if (isPermitted) {
        const parentTicketId = route.paramMap.get('parentTicketId');
        const resourceTrackerGlobalDataService = inject(ResourceTrackerGlobalDataService);
        resourceTrackerGlobalDataService.clearOnboardingResourceDetails();
        await resourceTrackerGlobalDataService.getOnboardingDetails(String(parentTicketId));
        return true;
      }
      return false;
    default:
      return false;
  }
};
