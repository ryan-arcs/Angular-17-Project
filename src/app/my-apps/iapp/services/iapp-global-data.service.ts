import { Injectable } from '@angular/core';
import { BehaviorSubject, from } from 'rxjs';
import { ApiResponseInterface } from '../interfaces/apiResponse';
import {
  ApiStatus,
  DashboardFilters,
  LogRequest,
} from '../interfaces/global-data.interface';
import { UIService } from 'src/app/common/services/ui.service';
import { messages, recordsPerPage } from '../constants';
import { ToastService } from 'src/app/common/services/toast.service';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/common/services/auth.service';
import { GlobalDataService as GS } from 'src/app/common/services/global-data.service';
import { ColumnFilter, GridPagination, GridSort } from '@app/common/interfaces/data-grid.interface';
import { RestApiService } from '@app/common/services/rest-api.service';

interface MulesoftApiLogRequest {
  application?: string;
  module: string;
  submodule?: string;
}
export interface ApplicationResult{
  data?: object[];
  pagination?: GridPagination;
  search? : string;
  sorting?: GridSort;
  columnFilters?: ColumnFilter[];
}

const defaultErrorBlock = {
  statusCode: 0,
  statusMessage: '',
  statusDescription: '',
};


@Injectable({
  providedIn: 'root',
})
export class IappGlobalDataService {

  private _globalApplicationName = new BehaviorSubject<string>('');
  globalApplicationName$ = this._globalApplicationName.asObservable();

  private _applicationResults = new BehaviorSubject<ApplicationResult>({data: []});
  applicationResults$ = this._applicationResults.asObservable();

  private _updateApplicationResults = new BehaviorSubject<Array<object>>([]);
  updateApplicationResults$ = this._updateApplicationResults.asObservable();

  private _updateScheduleResults = new BehaviorSubject<Array<object>>([]);
  updateScheduleResults$ = this._updateScheduleResults.asObservable();

  private _dashboardGridResults = new BehaviorSubject<Array<object>>([]);
  dashboardGridResults$ = this._dashboardGridResults.asObservable();

  private _dashboardGraphResults = new BehaviorSubject<Array<object>>([]);
  dashboardGraphResults$ = this._dashboardGraphResults.asObservable();

  private _deploymentIdResults = new BehaviorSubject<Array<object>>([]);
  deploymentIdResults$ = this._deploymentIdResults.asObservable();

  private _logResults = new BehaviorSubject<Array<object>>([]);
  logResults$ = this._logResults.asObservable();

  private _canLoadMoreLogs = new BehaviorSubject<boolean>(false);
  canLoadMoreLogs$ = this._canLoadMoreLogs.asObservable();

  private _scheduleResults = new BehaviorSubject<Array<object>>([]);
  scheduleResults$ = this._scheduleResults.asObservable();

  private _isChartLoading = new BehaviorSubject<boolean>(false);
  isChartLoading$ = this._isChartLoading.asObservable();

  private _isGridLoading = new BehaviorSubject<boolean>(false);
  isGridLoading$ = this._isGridLoading.asObservable();

  private isSidebarOpen = new BehaviorSubject<boolean>(false);
  public $isSidebarOpen = this.isSidebarOpen.asObservable();

  private _dashboardFilters = new BehaviorSubject<DashboardFilters>({
    duration: 7,
    pagination: {
      startIndex: 0,
      pageSize: recordsPerPage.defaultSize,
      totalCount: 0,
    },
    searchText : "",
    sortColumn : "",
    sortDirection : "",
    columnFilters : [],
  });
  dashboardFilters$ = this._dashboardFilters.asObservable();

  private _selectedInstanceId = new BehaviorSubject<string>('');
  private _selectedDuration = new BehaviorSubject<number>(7);
  selectedInstanceId$ = this._selectedInstanceId.asObservable();
  selectedDuration$ = this._selectedDuration.asObservable();

  private apiStatuses: Array<ApiStatus> = [];

  applicationsList: any;
  schedulesList: any[] = [];
  deploymentIdsList: any = [];
  dashboardChartData: any = [];
  logsList: any;
  dashboardDetailsList: any = [];
  dashboardGridData: any = [];
  private _apiResponse = new BehaviorSubject<ApiResponseInterface>(
    defaultErrorBlock,
  );
  apiResponse$ = this._apiResponse.asObservable();
  private lastRecordId = '';
  advanceSearchLimit = Number(environment.iAppLogAdvanceSearchLimit) || 100;

  private _isLoadingMoreLogs = new BehaviorSubject<boolean>(false);
  isLoadingMoreLogs$ = this._isLoadingMoreLogs.asObservable();

  constructor(
    private uiService: UIService,
    private toastService: ToastService,
    private authService: AuthService,
    private gs: GS,
    private restApiService: RestApiService
  ) {}

  resetErrorBlock() {
    this._apiResponse.next(defaultErrorBlock);
  }

  updateErrorBlock(tab: string) {
    const apiStatus = this.apiStatuses.find((apiStatus) => {
      return (
        apiStatus.apiCode === tab ||
        (tab === 'dashboard' &&
          ['dashboard-charts', 'dashboard-grid'].includes(apiStatus.apiCode))
      );
    });

    if (apiStatus?.apiCode) {
      this._apiResponse.next({
        statusCode: apiStatus?.statusCode,
        statusDescription: apiStatus?.statusDescription,
        statusMessage: apiStatus?.statusMessage,
      });
    } else {
      this.resetErrorBlock();
    }
  }

  setApiResponse(apiCode: string, data: any) {
    const apiStatus = {
      apiCode: apiCode,
      statusCode: data.statusCode,
      statusMessage: data.statusMessage,
      statusDescription: data.statusDescription,
    };

    if (data.statusCode == 204) {
      apiStatus.statusMessage = 'Oops! We couldn’t find any records.';
      switch (apiCode) {
        case 'projects':
          apiStatus.statusDescription = 'There are no project assigned to you.';
          break;
        case 'schedules':
          apiStatus.statusDescription =
            'There are no schedules for this application.';
          break;
        case 'deploymentIds':
          apiStatus.statusDescription =
            'There are no deployments for this application.';
          break;
        case 'logs':
          apiStatus.statusDescription = `There are no logs for this deployment(${this._globalApplicationName.getValue()}).`;
          break;
        case 'dashboard-charts':
          apiStatus.statusDescription =
            'There is no data for this duration. Please change and try again.';
          break;
        case 'dashboard-grid':
          apiStatus.statusDescription =
            'There is no data for this duration. Please change and try again.';
          break;
      }
    }

    const thisApiStatusIndex = this.apiStatuses.findIndex(
      (apiStatus: ApiStatus) => apiStatus.apiCode === apiCode,
    );
    if (thisApiStatusIndex > -1) {
      this.apiStatuses[thisApiStatusIndex] = apiStatus;
    } else {
      this.apiStatuses.push(apiStatus);
    }
    this._apiResponse.next({
      statusCode: apiStatus.statusCode,
      statusMessage: apiStatus.statusMessage,
      statusDescription: apiStatus.statusDescription,
    });
  }

  setGlobalApplicationName(newGlobalApplicationName: string) {
    const thisApplicationName = this._globalApplicationName.getValue();

    if (thisApplicationName !== newGlobalApplicationName) {
      this._deploymentIdResults.next([]);
      this._logResults.next([]);
      this.setselectedInstanceId('');
      this._globalApplicationName.next(newGlobalApplicationName);
      const resetApis = [
        'dashboard-grid',
        'dashboard-charts',
        'logs',
        'deploymentIds',
        'schedules',
      ];
      this.apiStatuses.forEach((status: ApiStatus) => {
        if (resetApis.includes(status.apiCode)) {
          status.statusCode = 0;
        }
      });
    }
  }

  setselectedInstanceId(newselectedInstanceId: string) {
    this._selectedInstanceId.next(newselectedInstanceId);
  }

  setDuration(newDuration: number) {
    this._selectedDuration.next(newDuration);
  }

  reloadData(apiCode: string) {
    const thisApiStatus = this.apiStatuses.find(
      (apiStatus: ApiStatus) =>
        apiStatus.apiCode === apiCode && apiStatus.statusCode,
    );
    return !thisApiStatus?.apiCode ? true : false;
  }

  async updateApplications() {
    try {
      this.resetErrorBlock();
      const response = await this.restApiService.getRequest({
        path: '/iapp/api/getAllApplicationDetails'
      });

      this._updateApplicationResults.next(
        response.data?.map((row: any) => {
          return {
            id: row?.id || '',
            status: (row?.deploymentUpdateStatus || row?.status) || '',
          };
        }),
      );
    } catch (error) {
      console.error('Error updating applications:', error);
    }
  }

  async updateSchedules() {
    try {
      this.resetErrorBlock();
      const response = await this.restApiService.getRequest({
        path: `/iapp/api/getSchedulerDetails/${this._globalApplicationName.value}`
      });

      this._updateScheduleResults.next(
        response?.data?.map((row: any) => {
          return {
            id: row?.id || '',
            status: row?.status || '',
            enabled: row?.enabled,
            schedule: row?.schedule,
            lastRun: row?.lastRun,
          };
        }),
      );
    } catch (error) {
      console.error('Error updating schedules:', error);
    }
  }

  async getApplications() {
    try {
      this.resetErrorBlock();
      this.uiService.setLoader(true);
      
      // Using the restApiService to fetch application details
      const data = await this.restApiService.getRequest({
        path: `/iapp/api/getAllApplicationDetails`
      });
      this.setApiResponse('projects', data);
      this._applicationResults.next({
        data: data.data?.filter((application: any) => {
          return this.authService.hasPermissionToAccessModule({
            appSlug: 'iapp',
            moduleSlug: 'projects',
            submoduleSlug: application?.domain || '',
            permissionSlug: 'view',
            ignoreRedirection: true,
          });
        }).map((application: any) => {
          return {
            ...application,
            status: application?.deploymentUpdateStatus || application?.status
          }
        })
      });
      this.uiService.setLoader(false);
    } catch (err: any) {
      this.setErrorResponse('projects', err);
    }
  }

  async getSchedules() {
    try {
      this.resetErrorBlock();
      this._scheduleResults.next([]);
      this.uiService.setLoader(true);
      
      // Using the restApiService to fetch application details
      const data = await this.restApiService.getRequest({
        path: `/iapp/api/getSchedulerDetails/${this._globalApplicationName.value}`
      });
      this.setApiResponse('schedules', data);
      this._scheduleResults.next(data.data);
      this.uiService.setLoader(false);
    } catch (err: any) {
      this.setErrorResponse('schedules', err);
    }
  }

  async manageApplication(action: string, applicationName: string) {
    try {
      this.resetErrorBlock();
      this.uiService.setLoader(true);
      
      let path = '';
      let message = '';
      
      switch (action) {
        case 'START':
          path = `/iapp/api/startApplication/${applicationName}`;
          message = messages.success.application.applicationStart.message;
          break;
        case 'RESTART':
          path = `/iapp/api/restartApplication/${applicationName}`;
          message = messages.success.application.applicationRestart.message;
          break;
        case 'STOP':
          path = `/iapp/api/stopApplication/${applicationName}`;
          message = messages.success.application.applicationStop.message;
          break;
        default:
          return false;
      }
      await this.restApiService.postRequest({
        path: path
      });
      this.toastService.fire({
        type: 'success',
        message: message,
        time: messages.success.application.applicationStart.time,
      });

      return true;
    } catch (error) {
      console.error('Error managing application:', error);
      return false;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async manageSchedular(
    action: string,
    paramsData: any,
    applicationName: string,
  ) {
    try {
      this.resetErrorBlock();
      this.uiService.setLoader(true);
      
      let payload: any = { id: paramsData.id };
      let message = '';
      
      switch (action) {
        case 'Enable':
          payload.enabled = true;
          message = messages.success.schedule.scheduleEventEnable.message;
          break;
        case 'Disable':
          payload.enabled = false;
          message = messages.success.schedule.scheduleEventDisable.message;
          break;
        case 'Run':
          payload.runNow = true;
          message = messages.success.schedule.scheduleEventRun.message;
          break;
        default:
          return false;
      }

      await this.restApiService.putRequest({
        path: `/iapp/api/modifySchedulers/${applicationName}`,
        body: payload
      });
      this.toastService.fire({
        type: 'success',
        message: message,
        time: messages.success.application.applicationStart.time,
      });

      return true;
    } catch (error) {
      console.error('Error managing scheduler:', error);
      return false;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getDeploymentIds() {
    try {
      this.resetErrorBlock();
      this.uiService.setLoader(true);

      // Using the restApiService to fetch application details
      const response = await this.restApiService.getRequest({
        path: `/iapp/api/getApplicationDeploymentIds/${this._globalApplicationName.value}`
      });
      this.setApiResponse('deploymentIds', response);
      const deploymentIdsList = response.data;
      deploymentIdsList.sort(
        (a: any, b: any) =>
          new Date(b.createTime).getTime() - new Date(a.createTime).getTime(),
      );
      this._deploymentIdResults.next(deploymentIdsList);

      return true;
    } catch (err: any) {
      this.setErrorResponse('deploymentIds', err);
      return false;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getLogs(logRequest?: LogRequest) {
    try {
      const selectedInstanceId = this.getSelectedInstanceId();
      if (!selectedInstanceId) {
        this.toastService.fire({
          type: 'error',
          message: 'Invalid selected instance id!',
        });
        return;
      }

      this.resetErrorBlock();
      this.uiService.setLoader(true);
      // if (!logRequest?.silentCall) {
      // }

      const advanceSearch =
        logRequest?.searchText ||
        logRequest?.startTime ||
        logRequest?.endTime ||
        logRequest?.priority
          ? true
          : false;

      const startTime = logRequest?.startTime || '';
      const endTime = logRequest?.endTime || '';

      let offset = undefined;

      if (!advanceSearch) {
        offset = Math.floor(
          Number(this._logResults.getValue()?.length) / this.advanceSearchLimit,
        );
      }

      const requestBody = {
        limit: this.advanceSearchLimit,
        instanceId: selectedInstanceId,
        searchText: logRequest?.searchText || undefined,
        startTime: new Date(startTime || '').getTime() || undefined,
        endTime: new Date(endTime || '').getTime() || undefined,
        priority: logRequest?.priority || undefined,
        lowerId:
          logRequest?.loadMore && this.lastRecordId
            ? this.lastRecordId
            : undefined,
      };
      
      const data = await this.restApiService.postRequest({
        path: `/iapp/api/fetchApplicationLogs/${this._globalApplicationName.value}`,
        queryParams: {
          advanceSearch: advanceSearch.toString(),
          offset: offset !== undefined ? offset.toString() : '',
        },
        body: requestBody
      });
      this.setApiResponse('logs', data);
      let apiLogs = [];
      if (advanceSearch) {
        const lastItem = data?.data?.slice(-1)[0];
        this.lastRecordId = lastItem?.recordId || '';
        apiLogs = data?.data?.map((row: any) => row?.event);
      } else {
        apiLogs = data?.data;
      }

      if (apiLogs?.length) {
        apiLogs[apiLogs.length - 1]['lastRecord'] = true;
      }

      if (this._isLoadingMoreLogs.getValue()) {
        this._logResults.next(
          advanceSearch
            ? this._logResults.getValue()?.concat(apiLogs)
            : apiLogs?.concat(this._logResults.getValue()),
        );
      } else {
        this._logResults.next(apiLogs);
      }
      this._canLoadMoreLogs.next(
        data?.data?.length < this.advanceSearchLimit ? false : true,
      );
      this.uiService.setLoader(false);
    } catch (err: any) {
      this.setErrorResponse('logs', err);
    }
  }

  setLogs(logs: any[] = []) {
    this._logResults.next(logs);
  }

  setApplications(applications: ApplicationResult) {
    this._applicationResults.next(applications);
  }

  getCachedLogs() {
    this._logResults.next(this._logResults.getValue());
  }

  getFileLogs(instanceId: string) {
    const response = this.restApiService.getRequest({
      path: `/iapp/api/getLogsFile/${this._globalApplicationName.value}`,
      queryParams: {
        instanceId: instanceId
      }
    });
    // convert them to Observables using from()
    return from(response);
  }

  async getDashboardGraphData(duration = 7) {
    try {
      this.uiService.setLoader(false);
      this.resetErrorBlock();
      this._dashboardGraphResults.next([]);
      this._isChartLoading.next(true);
      
      // Using the restApiService to fetch application details
      const data = await this.restApiService.getRequest({
        path: `/iapp/api/getDashboardCharts/${this._globalApplicationName.value}`,
        queryParams: {
          duration: duration.toString()
        }
      });
      this.setApiResponse('dashboard-charts', data);
      const filters = this._dashboardFilters.getValue();
      filters.duration = duration;
      this._dashboardFilters.next(filters);
      this._dashboardGraphResults.next(data.data);
      this._isChartLoading.next(false);
    } catch (err: any) {
      this._isChartLoading.next(false);
      this.setErrorResponse('dashboard-charts', err);
    }
  }

  async getDashboardGridData(
    duration = 7,
    startIndex = 1,
    pageSize = recordsPerPage.defaultSize,
    searchText = '',
    isPayloadRequired = false,
    sortColumn = '',
    sortDirection = '',
    columnFilters: any = []
  ) {
    try {
      
      // this.uiService.setLoader(true);
      this.resetErrorBlock();
      this._dashboardGridResults.next([]);
      this._isGridLoading.next(true);
      
      const queryParams = {
        duration: duration.toString(),
        pageSize: pageSize.toString(),
        startIndex: (startIndex - 1).toString(),
        searchText,
        isPayloadRequired: isPayloadRequired.toString(),
        sortColumn,
        sortDirection,
        columnFilters: JSON.stringify(columnFilters)
      };

       // Using the restApiService to fetch details
      const data = await this.restApiService.getRequest({
        path: `/iapp/api/getDashboardGrid/${this._globalApplicationName.value}`,
        queryParams: queryParams
      });
      this.setApiResponse('dashboard-grid', data);
      const filters = this._dashboardFilters.getValue();
      filters.duration = duration;
      filters.pagination.startIndex = startIndex;
      filters.pagination.pageSize = pageSize;
      filters.pagination.totalCount = data.totalCount;
      filters.searchText = searchText;
      filters.sortColumn = sortColumn;
      filters.sortDirection = sortDirection;
      filters.columnFilters = columnFilters;
      this._dashboardFilters.next(filters);
      this._dashboardGridResults.next(data);
      this._isGridLoading.next(false);
    } catch (err: any) {
      this.setErrorResponse('dashboard-grid', err);
      this._isGridLoading.next(false);
    } finally {
      // this.uiService.setLoader(false);
    }
  }

  setErrorResponse(apiCode: string, err: any) {
    const errorResponse = {
      statusCode: err.error.statusCode,
      statusMessage: err.error.statusMessage,
      statusDescription: err.error.statusDescription,
    };
    this.setApiResponse(apiCode, errorResponse);
    this.uiService.setLoader(false);
  }

  resetLogs() {
    this._logResults.next([]);
  }

  setIsLoadingMoreLogs(value: boolean) {
    this._isLoadingMoreLogs.next(value);
  }

  setCanLoadMoreLogs(value: boolean) {
    this._canLoadMoreLogs.next(value);
  }

  resetFilter() {
    this.resetLogs();
    this.setIsLoadingMoreLogs(false);
    this.setCanLoadMoreLogs(false);
  }

  getSelectedInstanceId() {
    return this._selectedInstanceId.getValue() || '';
  }

  getSelectedApplicationName() {
    return this._globalApplicationName.getValue() || '';
  }
  
  // toggleMainSidebar(){
  //   this.isSidebarOpen.next(!this.isSidebarOpen.getValue());
  // }
}
