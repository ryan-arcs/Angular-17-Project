/**
 *  Injects the UserAuthService to check user permissions that user has permission to access the module associated with the route.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { IappGlobalDataService } from '../services';
import { AuthService } from 'src/app/common/services/auth.service';
export const accessGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const iappGlobalDataService = inject(IappGlobalDataService);
  const path = route.routeConfig?.path
    ? (route.routeConfig?.path as string)
    : 'projects';

  const moduleSlug = path !== 'schedules' ? path : 'projects';
  const submoduleSlug =
    path !== 'projects'
      ? iappGlobalDataService.getSelectedApplicationName() || undefined
      : undefined;
  const isPermitted = authService.hasPermissionToAccessModule({
    appSlug: 'iapp',
    moduleSlug,
    submoduleSlug,
    permissionSlug: 'view',
    parentRoutePath:
      path !== 'projects' ? '/iapp/projects' : '/my-apps',
  });

  if (isPermitted) {
    switch (path) {
      case 'projects':
        if (iappGlobalDataService.reloadData('projects')) {
          iappGlobalDataService.getApplications();
        }
        break;
      case 'dashboard':
        if (iappGlobalDataService.reloadData('dashboard-charts')) {
          iappGlobalDataService.getDashboardGraphData();
        }

        if (iappGlobalDataService.reloadData('dashboard-grid')) {
          iappGlobalDataService.getDashboardGridData();
        }
        break;

      case 'logs':
        if (iappGlobalDataService.reloadData('deploymentIds')) {
          iappGlobalDataService.getDeploymentIds();
        }
        break;

      case 'schedules':
        if (iappGlobalDataService.reloadData('schedules')) {
          iappGlobalDataService.getSchedules();
        }
        break;
    }
  }
  return isPermitted;
};
