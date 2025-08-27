/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';
import { ResourceTrackerGlobalDataService } from '../services/resource-tracker-global-data.service';

export const offboardingAccessGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'offboarding';

  const parentRoutePath = '/resource-tracker/offboarding';

  switch (path) {
    case ':parentTicketId/details':
      const isPermitted = authService.hasPermissionToAccessModule({
        appSlug: 'resource_tracker',
        moduleSlug: 'offboarding',
        permissionSlug: 'view',
        parentRoutePath,
      });

      if (isPermitted) {
        const parentTicketId = route.paramMap.get('parentTicketId');
        const resourceTrackerGlobalDataService = inject(ResourceTrackerGlobalDataService);
        resourceTrackerGlobalDataService.clearOffboardingResourceDetails();
        await resourceTrackerGlobalDataService.getOffboardingDetails(String(parentTicketId));
        return true;
      }
      return false;
    default:
      return false;
  }
};
