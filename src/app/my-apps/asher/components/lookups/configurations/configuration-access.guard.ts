/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';

export const configurationAccessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'configurations';

  const parentRoutePath = '/asher/configurations';

  switch (path) {
    case ':id/edit':
      return authService.hasPermissionToAccessModule({
        appSlug: 'asher',
        moduleSlug: 'configurations',
        permissionSlug: 'edit',
        parentRoutePath,
      });
    default:
      return false;
  }
};
