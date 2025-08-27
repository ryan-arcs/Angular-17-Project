/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';
import { AsherGlobalDataService } from '../services';

export const accessGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'applications';

   // Construct expected parent route path
  const parentRoutePath = `/asher/${path}`;

  const isChildRoute = state.url.startsWith(`${parentRoutePath}/`);
    
  const isPermitted = authService.hasPermissionToAccessModule({
    appSlug: 'asher',
    moduleSlug: path.toLowerCase().replace(/[- ]/g, '_'),
    permissionSlug: 'list',
    parentRoutePath: '/my-apps',
    strictMode: !isChildRoute
  });

  if (isPermitted) {
    const asherGlobalDataService = inject(AsherGlobalDataService);

    //Initiating api data load in the access guard so that the loading of the component and api data loading can be performed simultaneously 
    asherGlobalDataService.loadRouteData(path);
  }

  return isPermitted;
};
