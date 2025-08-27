/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';

export const permissionAccessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'users';  
  const parentRoutePath = '/xapps-admin/permissions';
  switch (path) {
    case 'add':
      return authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'permissions',
        permissionSlug: 'add',
        parentRoutePath,
      });
    case ':id/edit':
      return authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'permissions',
        permissionSlug: 'edit',
        parentRoutePath,
      });

    default:
      return false;
  }
};
