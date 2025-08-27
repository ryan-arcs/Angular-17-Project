/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { XAppsAdminGlobalDataService } from '@app/my-apps/xapps-admin/services';
import { AuthService } from 'src/app/common/services/auth.service';

export const roleAccessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const xAppsAdminGlobalDataService = inject(XAppsAdminGlobalDataService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'roles';

  const application = route.data['application'] || '';
  const parentRoutePath = `/${application?.toLowerCase().replace(/[_ ]/g, '-') || 'xapps-admin'}`;
  const suppressedActions = route.data['suppressedActions'] || [];
  xAppsAdminGlobalDataService.setApplication(application);
  
  switch (path) {
    case 'roles': {
      const isPermitted = authService.hasPermissionToAccessModule({
        appSlug: application || 'xapps_admin',
        moduleSlug: 'roles',
        permissionSlug: 'view',
        parentRoutePath,
      });
      if(isPermitted){
        const filterPayload = xAppsAdminGlobalDataService.buildFilterListingPayload(xAppsAdminGlobalDataService._rolesResults.getValue())
        xAppsAdminGlobalDataService.getRoles(filterPayload);
      }
      return isPermitted;   
    }
    case 'add': {
      const isPermitted = authService.hasPermissionToAccessModule({
        appSlug: application || 'xapps_admin',
        moduleSlug: 'roles',
        permissionSlug: 'add',
        parentRoutePath,
      });
      if(isPermitted){
        if(isActionSuppressed(suppressedActions, 'add')){
          authService.performInvalidAccessAction(false);
          return false;
        }
      }
      return isPermitted;   
    }
    case ':id/edit': {
      const isPermitted = authService.hasPermissionToAccessModule({
        appSlug: application || 'xapps_admin',
        moduleSlug: 'roles',
        permissionSlug: 'edit',
        parentRoutePath,
      });
      if(isPermitted){
        if(isActionSuppressed(suppressedActions, 'edit')){
          authService.performInvalidAccessAction(false);
          return false;
        }
      }
      return isPermitted;
    }
    case ':id/manage-permissions': {
      const isPermitted = authService.hasPermissionToAccessModule({
        appSlug: application || 'xapps_admin',
        moduleSlug: 'roles',
        permissionSlug: 'manage_permissions',
        parentRoutePath,
      });

      if (isPermitted) {
        if(isActionSuppressed(suppressedActions, 'manage_permissions')){
          authService.performInvalidAccessAction(false);
          return false;
        }
        return true;
      }
      return false;
    }

    case ':id/manage-users': {
      const isPermitted = authService.hasPermissionToAccessModule({
        appSlug: application || 'xapps_admin',
        moduleSlug: 'roles',
        permissionSlug: 'manage_users',
        parentRoutePath,
      });

      // if (isPermitted) {
      //   if(isActionSuppressed(suppressedActions, 'manage_users')){
      //     authService.performInvalidAccessAction(false);
      //     return false;
      //   }
      //   const uiService = inject(UIService);
      //   uiService.setForceLoader(true);
      //   const xAppsAdminGlobalDataService = inject(XAppsAdminGlobalDataService);
      //   const roleId = route.paramMap.get('id');
      //   if (roleId) {
      //     xAppsAdminGlobalDataService.getRoleDetails({
      //       id: roleId,
      //     });
      //   }
      //   return true;
      // }
      return true;
    }

    default:
      return false;
  }
};

const isActionSuppressed = (suppressedActions: Array<string>, action: string) => {
  return suppressedActions.includes(action);
}