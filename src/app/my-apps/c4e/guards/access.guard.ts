import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';
import { C4EGlobalDataService } from '../services/c4e-global-data.service';
import { ToastService } from 'src/app/common/services/toast.service';
import { recordsPerPage } from '../constants/global.constant';

@Injectable({
  providedIn: 'root',
})
export class C4eAccessGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private c4eGlobalDataService: C4EGlobalDataService,
    private router: Router,
    private toastService: ToastService
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<any> {
    const path = route.routeConfig?.path
      ? (route.routeConfig?.path as string)
      : 'c4e';
    const isTablesPermitted = this.authService.hasPermissionToAccessModule({
      appSlug: 'c4e',
      moduleSlug: 'tables',
      permissionSlug: 'view',
      ignoreRedirection: true,
    });

    const isViewsPermitted = this.authService.hasPermissionToAccessModule({
      appSlug: 'c4e',
      moduleSlug: 'views',
      permissionSlug: 'view',
      ignoreRedirection: true,
    });

    const isPermitted = isTablesPermitted || isViewsPermitted;
    if (isPermitted) {
      switch (path) {
        case 'c4e':
          await this.c4eGlobalDataService.getTableAndViewNames();
          break;

        case 'list':
          {
            const { apiTables, apiViews }: any =
              await this.c4eGlobalDataService.getTableAndViewNames();
            if (apiTables?.length || apiViews?.length) {
              const subPath = apiTables?.sort()?.[0] || apiViews?.sort()?.[0];
              this.router.navigate([`c4e/list/${subPath}`]);
              return false;
            } else {
              this.router.navigate(['my-apps']);
              return false;
            }
          }
          break;

        case 'list/:tableName':
          {
            const tableName = route.paramMap.get('tableName');
            const { apiTables, apiViews }: any =
              await this.c4eGlobalDataService.getTableAndViewNames();

            if (
              tableName &&
              (apiTables?.some((table: string) => table === tableName) ||
                apiViews?.some((view: string) => view === tableName))
            ) {
              this.c4eGlobalDataService.setSelectedTableName(tableName);
              if (this.c4eGlobalDataService.reloadData(tableName)) {
                this.c4eGlobalDataService.getTableData(tableName, 1, recordsPerPage.defaultSize, '');
              } else {
                this.c4eGlobalDataService.setSelectedTableData(tableName);
              }
            } else {
              this.toastService.fire({
                type: 'error',
                message: 'Table or view not found!',
              });
              this.router.navigate(['my-apps']);
              return false;
            }
          }
          break;

      }
    } else {
      this.toastService.fire({
        type: 'error',
        message: "You don't have permission to view this module",
      });
      this.router.navigate(['my-apps']);
      return false;
    }
  }
}
