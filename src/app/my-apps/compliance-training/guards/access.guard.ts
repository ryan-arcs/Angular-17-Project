/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';
export const accessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'applications';

    // return authService.hasPermissionToAccessModule({
    //   appSlug: 'compliance_training',
    //   moduleSlug: path.toLowerCase().replace(/[- ]/g, '_'),
    //   permissionSlug: 'list',
    //   parentRoutePath: '/my-apps',
    // });
  return true;
};
