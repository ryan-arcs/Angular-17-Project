import { Injectable } from '@angular/core';
import { UIService } from 'src/app/common/services/ui.service';
import { BehaviorSubject } from 'rxjs';
import { ToastService } from 'src/app/common/services/toast.service';
import { ApiStatus } from '../interfaces/global.interface';
import { AuthService } from 'src/app/common/services/auth.service';
import { messages, recordsPerPage } from '../constants';
import { downloadData, remove } from 'aws-amplify/storage';
import { GlobalDataService as GS } from 'src/app/common/services/global-data.service';
import { fetchAuthSession } from 'aws-amplify/auth';
import { environment } from '@environments/environment';

interface ApiTable {
  table_name: string;
}

export interface TableGridPagination {
  startIndex: number;
  pageSize: number;
  totalCount: number;
}

interface ApiLogRequest {
  application?: string;
  module: string;
  submodule?: string;
}

interface TableInfo {
  tableName: string;
  rows: Array<any>;
  columns: Array<string>;
  pagination: TableGridPagination;
  columnsInfo: Array<any>;
  loaded: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class C4EGlobalDataService {
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
    columnsInfo: [],
    columns: [],
    pagination: {
      startIndex: 0,
      pageSize: recordsPerPage.defaultSize,
      totalCount: 0,
    },
    loaded: false
  });
  selectedTable$ = this._selectedTable.asObservable();

  private apiStatuses: Array<ApiStatus> = [];
  errorBlockTriggered = false;
  constructor(
    private uiService: UIService,
    private toastService: ToastService,
    private authService: AuthService,
    private gs: GS,
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

  async downloadTableData(tableName: string, searchText = '') {
    try {
      this.uiService.setLoader(true);
      const data = await this.client.mutations.shootC4eQuery({
        method: 'GET',
        tableName,
        searchText,
        download: true,
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
      const data = await this.client.mutations.shootC4eQuery({
        method: 'GET',
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
      const { totalCount, queryResult, statusCode, message, tableColumns } = results;
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
        currentTable.columnsInfo = tableColumns || [];
      } else {
        allTables.push({
          tableName,
          data: queryResult,
          pagination: thisPagination,
          columnsInfo: tableColumns || [],
        });
      }

      this._tablesData.next(allTables);
      this._selectedTable.next({
        tableName: tableName,
        rows: queryResult,
        columns: queryResult?.length ? Object.keys(queryResult[0]) : [],
        pagination: thisPagination,
        columnsInfo: tableColumns || [],
        loaded: true
      });
      this.reloadData('db-tables');
      if (!searchText) {
        this.setApiResponse(tableName, 200);
      } else {
        this.unsetApiResponse(tableName);
      }
      this.uiService.setLoader(false);
    } catch (err: any) {
      let message = err?.message || 'Something went wrong.';

      if (!this.errorBlockTriggered) {
        this.errorBlockTriggered = true;
        message += ' Fetching data again with page size 500.';

        this.getTableData(tableName, 1, 500, searchText, true);
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
        columnsInfo: tableData?.columnsInfo || [],
        columns: tableData?.data?.length ? Object.keys(tableData.data[0]) : [],
        pagination: tableData.pagination,
        loaded: true
      });
    }
  }

  async getTableAndViewNames() {
    try {
      if (this.reloadData('db-tables')) {
        this.uiService.setLoader(true);

        const queryResult = await this.client.mutations.shootC4eQuery({
          method: 'GET',
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

        this._dbTables.next(tables || []);
        this._dbViews.next(views || []);

        this.setApiResponse('db-tables', 200);
        return { apiTables: tables, apiViews: views };
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

  updateTablesData(tableName: string, newRow: any, rowId : number| null = null){
    const tablesData = this._tablesData.getValue();

    if(!rowId){
      const tableDataIndex = tablesData?.findIndex((data:any)=> data.tableName == tableName);
      if(tableDataIndex > -1){
        tablesData[tableDataIndex].data = [newRow].concat(tablesData[tableDataIndex]?.data); 
      }
    }else{
      const tableDataIndex = tablesData?.findIndex((data:any)=> data.tableName == tableName);
      if(tableDataIndex > -1){
        const rowIndex = tablesData[tableDataIndex].data?.findIndex((row: any)=> row.id == rowId);
        tablesData[tableDataIndex].data[rowIndex] = newRow;
      }
    }

    this._tablesData.next(tablesData);
  }

  async addRecord(tableData: any, tableName: string) {
    try {
      this.uiService.setLoader(true);

      const queryResult = await this.client.mutations.shootC4eQuery({
        method: 'POST',
        tableName,
        rowData: JSON.stringify(tableData),
      });
      const { errors } = queryResult;
      if (errors?.length) {
        throw new Error(errors[0]?.message || 'Unknown error!');
      }

      const { statusCode, message } = JSON.parse(
        String(queryResult?.data),
      );
      
      if (statusCode === 520) {
        throw new Error(message);
      }

      this.updateTablesData(tableName, JSON.parse(String(queryResult?.data)).queryResult[0], null);
      
      this.toastService.fire({
        type: 'success',
        message: messages.success.c4e.add,
      });


    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
    }
    finally{
      this.uiService.setLoader(false);
    }
  }

  async editRecord(tableData: any, tableName: string, rowId: number) {
    try {
      this.uiService.setLoader(true);
      const authSession = await fetchAuthSession();
      const token = authSession?.tokens?.idToken?.toString();
      
      const queryResult = await this.client.mutations.shootC4eQuery({
        method: 'PUT',
        tableName,
        rowId,
        rowData: JSON.stringify(tableData),
        userToken: token
      });
      const { errors } = queryResult;
      if (errors?.length) {
        throw new Error(errors[0]?.message || 'Unknown error!');
      }

      const { statusCode, message } = JSON.parse(
        String(queryResult?.data),
      );

      if (statusCode === 520) {
        throw new Error(message);
      }

      this.updateTablesData(tableName, JSON.parse(String(queryResult?.data)).queryResult[0], rowId);
      this.toastService.fire({
        type: 'success',
        message: messages.success.c4e.edit,
      });



      // this._dbTables.next(tables || []);
      // this._dbViews.next(views || []);

      // return { apiTables: tables, apiViews: views };
      // } else {
      //   const apiTables = this._dbTables.getValue();
      //   const apiViews = this._dbViews.getValue();
      //   return { apiTables, apiViews };
      // }
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
      this.setApiResponse('db-tables', Number(err?.statusCode) || 520);
    } finally {
      this.uiService.setLoader(false);
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


  getPermittedTables(){
    const decryptedCreds = atob(environment.c4ePermittedTables);
    if (decryptedCreds) {
      return JSON.parse(decryptedCreds) || '';
    }
  }
}
