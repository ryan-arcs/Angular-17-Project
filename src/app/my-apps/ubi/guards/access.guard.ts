/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@app/common/services/auth.service';

export const accessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'home';
    
  return authService.hasPermissionToAccessModule({
      appSlug: 'ubi',
      moduleSlug: path === 'projects' ? 'home' : path,
      permissionSlug: 'view',
      parentRoutePath: '/my-apps',
    });
};
