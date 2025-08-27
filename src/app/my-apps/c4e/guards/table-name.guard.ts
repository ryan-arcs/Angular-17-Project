import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { C4EGlobalDataService } from '../services/c4e-global-data.service';
import { ToastService } from 'src/app/common/services/toast.service';

@Injectable({
  providedIn: 'root',
})
export class TableNameGuard implements CanActivate {
  constructor(
    private c4eGlobalDataService: C4EGlobalDataService,
    private router: Router,
    private toastService: ToastService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const tableName = route.paramMap.get('tableName');

    if (!tableName) {
      this.router.navigate(['/myapps']);
      return false;
    }

    const allTables = this.c4eGlobalDataService.getAllTables();
    const tableExists = allTables.some(
      (table: any) => table.table_name === tableName,
    );

    if (tableExists) {
      return true;
    } else {
      this.toastService.fire({
        type: 'error',
        message: 'Table not found.',
      });
      this.router.navigate(['/myapps']);
      return false;
    }
  }
}
