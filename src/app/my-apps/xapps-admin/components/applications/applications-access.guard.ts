/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';

export const applicationAccessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'add';

  const parentRoutePath = '/xapps-admin/applications';
  switch (path) {
    case 'add':
      return authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'applications',
        permissionSlug: 'add',
        parentRoutePath,
      });
    case ':id/edit':
      return authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'applications',
        permissionSlug: 'edit',
        parentRoutePath,
      });

    default:
      return false;
  }
};
