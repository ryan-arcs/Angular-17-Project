import { Injectable } from '@angular/core';
import { UIService } from 'src/app/common/services/ui.service';
import { BehaviorSubject } from 'rxjs';
import { ToastService } from 'src/app/common/services/toast.service';
import { Router } from '@angular/router';
import { ApiStatus } from '../interfaces/global.interface';
import { AuthService } from 'src/app/common/services/auth.service';
import { recordsPerPage } from '../constants';
import { downloadData, remove } from 'aws-amplify/storage';
import { GridColumn, GridSort } from '@app/common/interfaces/data-grid.interface';

interface ApiTable {
  table_name: string;
}

export interface TableGridPagination {
  startIndex: number;
  pageSize: number;
  totalCount: number;
}

interface TableInfo {
  tableName: string;
  rows: Array<any>;
  columns: Array<string>;
  pagination: TableGridPagination;
  searchText: string;
  sorting: GridSort;
  columnFilters: any;
  loaded: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class WdhGlobalDataService {
  private client:any = '';

  private _tablesData = new BehaviorSubject<any>([]);
  tablesData$ = this._tablesData.asObservable();

  private _dbTables = new BehaviorSubject<any>([]);
  dbTables$ = this._dbTables.asObservable();

  private _dbViews = new BehaviorSubject<any>([]);
  dbviews$ = this._dbViews.asObservable();

  private _usersResults = new BehaviorSubject<any[]>([]);
  usersResults$ = this._usersResults.asObservable();

  private _tableName = new BehaviorSubject<string>('');
  tableName$ = this._tableName.asObservable();

  private _selectedTable = new BehaviorSubject<TableInfo>({
    tableName: '',
    rows: [],
    columns: [],
    pagination: {
      startIndex: 0,
      pageSize: recordsPerPage.defaultSize,
      totalCount: 0,
    },
    searchText: '',
    sorting : {prop: '', dir: ''},
    columnFilters: [],
    loaded: false
  });
  selectedTable$ = this._selectedTable.asObservable();

  private apiStatuses: Array<ApiStatus> = [];
  errorBlockTriggered = false;
  constructor(
    private uiService: UIService,
    private toastService: ToastService,
    private authService: AuthService,
  ) {}

  reloadData(apiCode: string) {
    const thisApiStatus = this.apiStatuses.find(
      (apiStatus: ApiStatus) =>
        apiStatus.apiCode === apiCode && apiStatus.statusCode,
    );
    return !thisApiStatus?.apiCode ? true : false;
  }

  setApiResponse(apiCode: string, statusCode: number) {
    this.apiStatuses.push({
      apiCode,
      statusCode,
    });
  }

  unsetApiResponse(apiCode: string) {
    this.apiStatuses = this.apiStatuses.filter(
      (status) => status.apiCode !== apiCode,
    );
  }

  async downloadTableData(
    tableName: string,
    searchText = '',
    pageSize = recordsPerPage.defaultSize,
    sortColumn = '',
    sortDirection = '',
    columnFilters: any = []
  ) 
  {
    try {
      this.uiService.setLoader(true);
      const data = await this.client.queries.shootWdhQuery({
        tableName,
        searchText,
        download: true,
        pageSize,
        sortColumn,
        sortDirection ,
        columnFilters: JSON.stringify(columnFilters),
      });

      const { errors } = data;
      if (errors?.length) {
        throw new Error(errors[0]?.message || 'Unknown error!');
      }

      const queryResult = JSON.parse(String(data?.data));

      const { errorMessage, filePath } = queryResult;

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      if (filePath) {
        const downloadResult = await downloadData({
          path: filePath,
          options: {
            onProgress: (progress) => {
              if (progress.totalBytes) {
                const totalProgress =
                  progress.transferredBytes / progress.totalBytes;
                if (totalProgress === 1) {
                  setTimeout(async () => {
                    await remove({
                      path: filePath,
                    });
                  }, 1000);
                }
              }
            },
          },
        }).result;
        const text = await downloadResult.body.text();
        const fileName = `${tableName}-records${searchText ? '-with-search(' + searchText + ')' : ''}-${this.currentDate()}`;
        const file = new Blob([text || ''], {
          type: 'text/csv',
        });
        const fileURL = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = fileURL;
        a.target = '_blank';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
      }
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
        time: 20,
      });
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getTableData(
    tableName: string,
    startIndex = 1,
    pageSize = recordsPerPage.defaultSize,
    searchText = '',
    resendRequest = false,
    sortColumn = '',
    sortDirection = '',
    columnFilters: any = []
  ) {
    try {
      if (!resendRequest) {
        this.errorBlockTriggered = false;
      }
      this.uiService.setLoader(true);
      // Query to get the total count

      const data = await this.client.queries.shootWdhQuery({
        tableName,
        searchText,
        startIndex: startIndex - 1,
        pageSize,
        sortColumn,
        sortDirection,
        columnInfoRequired: true,
        columnFilters: JSON.stringify(columnFilters)
      });
      const { errors } = data;

      if (errors?.length) {
        throw new Error(errors[0]?.message || 'Unknown error!');
      }

      const results = JSON.parse(String(data?.data));
      let allColumns: any = [];
      results.tableColumns.forEach((element:any)=>{
        allColumns.push(element.column_name)
      })

      const { errorMessage, totalCount, queryResult, statusCode, message } = results;

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      if (statusCode === 520) {
        throw new Error(message);
      }

      //setting data
      const thisPagination = {
        startIndex,
        pageSize,
        totalCount,
      };
      const allTables = this._tablesData.getValue();
      const currentTable = allTables.find(
        (table: any) => table.tableName === tableName,
      );

      if (currentTable?.tableName) {
        currentTable.data = queryResult;
        currentTable.pagination = thisPagination;
        currentTable.searchText = searchText;
        currentTable.sorting = {prop: sortColumn, dir: sortDirection};
        currentTable.columnFilters = columnFilters
        currentTable.columns = (allColumns.length > 0) ? allColumns : []
      } else {
        allTables.push({
          tableName,
          data: queryResult,
          pagination: thisPagination,
          searchText: searchText,
          sorting: {prop: sortColumn, dir: sortDirection},
          columnFilters: columnFilters || [],
          columns: (allColumns.length > 0) ? allColumns : [],
        });
      }

      this._tablesData.next(allTables);
      this._selectedTable.next({
        tableName: tableName,
        rows: queryResult,
        columns: (allColumns.length > 0) ? allColumns : [],
        pagination: thisPagination,
        searchText,
        sorting: {prop: sortColumn, dir: sortDirection},
        columnFilters: columnFilters || [],
        loaded: true
      });

      this.setApiResponse(tableName, 200);
      this.uiService.setLoader(false);
    } catch (err: any) {
      let message = err?.message || 'Something went wrong.';

      if (!this.errorBlockTriggered) {
        this.errorBlockTriggered = true;
        message += ' Fetching data again with page size 2000.';
        this.getTableData(tableName, 1, 2000, searchText, true);
      } else {
        this.uiService.setLoader(false);
      }

      this.toastService.fire({
        type: 'error',
        message,
        time: 20,
      });
    }
  }

  setSelectedTableData(tableName: string) {
    const allTables = this._tablesData.getValue();
    const tableData = allTables.find(
      (table: any) => table.tableName === tableName,
    );
    if (tableData) {
      this._selectedTable.next({
        tableName: tableData.tableName,
        rows: tableData?.data || [],
        columns: tableData?.columns || [],
        pagination: tableData.pagination,
        searchText: tableData.searchText,
        sorting : tableData.sorting,
        columnFilters: tableData.columnFilters,
        loaded: true
      });
    }
  }

  async getTableAndViewNames() {
    try {
      if (this.reloadData('db-tables')) {
        this.uiService.setLoader(true);

        const queryResult = await this.client.queries.shootWdhQuery({
          allTables: true,
        });
        const { errors } = queryResult;
        if (errors?.length) {
          throw new Error(errors[0]?.message || 'Unknown error!');
        }

        const { tables, views, statusCode, message } = JSON.parse(
          String(queryResult?.data),
        );
        if (statusCode === 520) {
          throw new Error(message);
        }

        const filteredTables = tables?.filter((table: string) =>
          this.authService.hasPermissionToAccessModule({
            appSlug: 'wdh',
            moduleSlug: 'tables',
            permissionSlug: table?.trim()?.toLowerCase().replace(/\s+/g, '_'),
            ignoreRedirection: true,
          }),
        );

        const filteredViews = views?.filter((view: string) =>
          this.authService.hasPermissionToAccessModule({
            appSlug: 'wdh',
            moduleSlug: 'views',
            permissionSlug: view?.trim()?.toLowerCase().replace(/\s+/g, '_'),
            ignoreRedirection: true,
          }),
        );

        this._dbTables.next(filteredTables || []);
        this._dbViews.next(filteredViews || []);

        this.setApiResponse('db-tables', 200);
        return { apiTables: filteredTables, apiViews: filteredViews };
      } else {
        const apiTables = this._dbTables.getValue();
        const apiViews = this._dbViews.getValue();
        return { apiTables, apiViews };
      }
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
      this.setApiResponse('db-tables', Number(err?.statusCode) || 520);
      return false;
    }
  }

  getAllTables() {
    return this._dbTables.getValue();
  }

  setSelectedTableName(tableName: string) {
    this._tableName.next(tableName ?? '');
  }

  currentDate() {
    const date = new Date();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const daySuffix =
      day === 1 || day === 21 || day === 31
        ? 'st'
        : day === 2 || day === 22
          ? 'nd'
          : day === 3 || day === 23
            ? 'rd'
            : 'th';

    const year = String(date.getFullYear()).slice(-2); // Get last two digits of the year
    const hours = date.getHours() % 12 || 12; // Convert to 12-hour format
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Ensure two digits
    const period = date.getHours() < 12 ? 'AM' : 'PM'; // Determine AM/PM

    return `${month}-${day}${daySuffix}-${year}-${String(hours).padStart(2, '0')}-${minutes}-${period}`;
  }
}
