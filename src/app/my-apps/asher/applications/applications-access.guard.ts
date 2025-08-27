/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';

export const asherAccessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'applications';

  const parentRoutePath = '/asher/applications';

  switch (path) {
    case 'add':
      return authService.hasPermissionToAccessModule({
        appSlug: 'asher',
        moduleSlug: 'applications',
        permissionSlug: 'add',
        parentRoutePath,
      });
    case ':id/edit':
      return authService.hasPermissionToAccessModule({
        appSlug: 'asher',
        moduleSlug: 'applications',
        permissionSlug: 'edit',
        parentRoutePath,
      });
    case ':id/application-details':
      return authService.hasPermissionToAccessModule({
        appSlug: 'asher',
        moduleSlug: 'applications',
        permissionSlug: 'details',
        parentRoutePath,
      });
    default:
      return false;
  }
};
