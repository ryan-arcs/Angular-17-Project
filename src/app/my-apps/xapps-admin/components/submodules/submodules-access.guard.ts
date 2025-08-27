/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';
import { XAppsAdminGlobalDataService } from '../../services';

export const submoduleAccessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const xAppsAdminGlobalDataService = inject(XAppsAdminGlobalDataService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'users';
  xAppsAdminGlobalDataService.getApplicationLookup();
  const parentRoutePath = '/xapps-admin/roles';
  switch (path) {
    case 'add':
      return authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'submodules',
        permissionSlug: 'add',
        parentRoutePath,
      });
    case ':id/edit':
      return authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'submodules',
        permissionSlug: 'edit',
        parentRoutePath,
      });

    default:
      return false;
  }
};
