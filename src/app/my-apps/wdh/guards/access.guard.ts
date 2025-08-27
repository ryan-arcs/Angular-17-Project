import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';
import { WdhGlobalDataService } from '../services/wdh-global-data.service';
import { ToastService } from 'src/app/common/services/toast.service';
import { recordsPerPage } from '../constants/global.constant';


@Injectable({
  providedIn: 'root',
})
export class AccessGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private wdhGlobalDataService: WdhGlobalDataService,
    private router: Router,
    private toastService: ToastService,
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<any> {
    const path = route.routeConfig?.path
      ? (route.routeConfig?.path as string)
      : 'wdh';
    const isTablesPermitted = this.authService.hasPermissionToAccessModule({
      appSlug: 'wdh',
      moduleSlug: 'tables',
      permissionSlug: 'view',
      ignoreRedirection: true,
    });

    const isViewsPermitted = this.authService.hasPermissionToAccessModule({
      appSlug: 'wdh',
      moduleSlug: 'views',
      permissionSlug: 'view',
      ignoreRedirection: true,
    });

    const isPermitted = isTablesPermitted || isViewsPermitted;
    if (isPermitted) {
      switch (path) {
        case 'wdh':
          await this.wdhGlobalDataService.getTableAndViewNames();
          break;

        case 'list':
          {
            const { apiTables, apiViews }: any =
              await this.wdhGlobalDataService.getTableAndViewNames();
            if (apiTables?.length || apiViews?.length) {
              const sortedTables = apiTables?.sort((a:any, b:any) => 
                a.toLowerCase().localeCompare(b.toLowerCase())
              );
              const sortedViews = apiViews?.sort((a:any, b:any) => 
                a.toLowerCase().localeCompare(b.toLowerCase())
              );
              const subPath = sortedTables?.[0] || sortedViews?.[0];
              this.router.navigate([`wdh/list/${subPath}`]);
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
              await this.wdhGlobalDataService.getTableAndViewNames();

            if (
              tableName &&
              (apiTables?.some((table: string) => table === tableName) ||
                apiViews?.some((view: string) => view === tableName))
            ) {
              this.wdhGlobalDataService.setSelectedTableName(tableName);
              if (this.wdhGlobalDataService.reloadData(tableName)) {
                this.wdhGlobalDataService.getTableData(tableName, 1, recordsPerPage.defaultSize, '');
              } else {
                this.wdhGlobalDataService.setSelectedTableData(tableName);
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
