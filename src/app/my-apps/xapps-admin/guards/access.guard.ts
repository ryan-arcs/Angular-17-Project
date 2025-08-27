import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { XAppsAdminGlobalDataService } from '../services';
import { AuthService } from '../../../common/services/auth.service';

export const accessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'users';


  // const isPermitted = authService.hasPermissionToAccessModule({
  //   appSlug: 'xapps_admin',
  //   moduleSlug: path.toLowerCase().replace(/[- ]/g, '_'),
  //   permissionSlug: 'view',
  //   parentRoutePath: '/my-apps',
  // });

  // if (isPermitted) {
  // }
  const xappsAdminGlobalDataService = inject(XAppsAdminGlobalDataService);
  switch (path) {
    case 'users':
      if (xappsAdminGlobalDataService.reloadData('users')) {
        await xappsAdminGlobalDataService.getUsers();
      }
      break;
    case 'applications':
      if (xappsAdminGlobalDataService.reloadData('applications')) {
        await xappsAdminGlobalDataService.getApplications();
      }
      break;
    case 'modules':
      if (xappsAdminGlobalDataService.reloadData('modules')) {
        await xappsAdminGlobalDataService.getModules();
      }
      break;
    // case 'roles':
    //   if (xappsAdminGlobalDataService.reloadData('roles')) {
    //     await xappsAdminGlobalDataService.getRoles();
    //   }
    //   break;
    case 'submodules':
      if (xappsAdminGlobalDataService.reloadData('submodules')) {
        await xappsAdminGlobalDataService.getSubmodules();
      }
      break;
    case 'permissions':
      if (xappsAdminGlobalDataService.reloadData('permissions')) {
        await xappsAdminGlobalDataService.getPermissions();
      }
      break;
  }

  return true;
};
