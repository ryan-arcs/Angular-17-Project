/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';

export const userAccessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'users';

  const parentRoutePath = '/asher/users';

  switch (path) {
    case ':email/user-details':
      return authService.hasPermissionToAccessModule({
        appSlug: 'asher',
        moduleSlug: 'users',
        permissionSlug: 'details',
        parentRoutePath,
      });
    default:
      return false;
  }
};
