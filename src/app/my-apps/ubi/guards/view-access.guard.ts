/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TableauGlobalDataServiceNew } from '../services';
import { AuthService } from '@app/common/services/auth.service';

export const viewAccessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'home';
    
  const isPermitted = authService.hasPermissionToAccessModule({
      appSlug: 'ubi',
      moduleSlug: path !== 'personas' ? 'home' : 'personas',
      permissionSlug: 'view',
      parentRoutePath: '/my-apps',
    });
  
    if (isPermitted) {
      const tableauGlobalDataService = inject(TableauGlobalDataServiceNew);

      //Initiating api data load in the access guard so that the loading of the component and api data loading can be performed simultaneously 
      await tableauGlobalDataService.loadRouteData(path);
    }
  
  return isPermitted;  
};
