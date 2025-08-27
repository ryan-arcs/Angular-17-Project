/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';
import { UIService } from 'src/app/common/services/ui.service';

export const userAccessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'users';

  const parentRoutePath = '/xapps-admin/users';

  switch (path) {
    case 'add':
      return authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'users',
        permissionSlug: 'add',
        parentRoutePath,
      });
    case ':id/edit':
      return authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'users',
        permissionSlug: 'edit',
        parentRoutePath,
      });

    case ':id/manage-roles': {
      const isPermitted = authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'users',
        permissionSlug: 'manage_roles',
        parentRoutePath,
      });
      if (isPermitted) {
        return true;
      }
      return false;
    }

    case ':id/special-permissions':
      return authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'users',
        permissionSlug: 'special_permissions',
        parentRoutePath,
      });

    default:
      return false;
  }
};
