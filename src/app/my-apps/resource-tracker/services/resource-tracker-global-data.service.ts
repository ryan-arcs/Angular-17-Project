import { Injectable } from '@angular/core';
import { UIService } from 'src/app/common/services/ui.service';
import { BehaviorSubject } from 'rxjs';
import { ToastService } from 'src/app/common/services/toast.service';
import { UserProfileService } from 'src/app/common/services/user-profile.service';
import { recordsPerPage } from '../constants';
import {
  ApiStatus,
  OffboardingResource,
  OnboardingResource,
} from '../interfaces/global.interface';

import {
  ColumnFilter,
} from '@app/common/interfaces/data-grid.interface';

export interface TableGridPagination {
  startIndex: number;
  pageSize: number;
  totalCount: number;
}

export interface OnboardingRowCountByStatus {
  completed?: {
    count?: number;
    legend?: string;
  };
  inprogress?: {
    count?: number;
    legend?: string;
  };
  notstarted?: {
    count?: number;
    legend?: string;
  };
  invalid?: {
    count?: number;
    legend?: string;
  };
}

export interface OffboardingRowCountByStatus {
  completed?: {
    count?: number;
    legend?: string;
  };
  inprogress?: {
    count?: number;
    legend?: string;
  };
  notstarted?: {
    count?: number;
    legend?: string;
  };
}

export interface OnboardingList {
  data?: Array<any>;
  pagination?: TableGridPagination;
  searchText?: string;
  sorting?: {
    prop?: string;
    dir?: string;
  };
  columnFilters?: Array<ColumnFilter>;
  selectedOnboardingStatuses?: Array<string>;
  [key: string]: any;
}

export interface OffboardingList {
  data?: Array<any>;
  pagination?: TableGridPagination;
  searchText?: string;
  sorting?: {
    prop?: string;
    dir?: string;
  };
  columnFilters?: Array<ColumnFilter>;
  selectedOffboardingStatuses?: Array<string>;
  [key: string]: any;
}

const initialOnboardingResourceDetails = {
  employeeId: '',
  firstName: '',
  lastName: '',
};

const initialOffboardingResourceDetails = {
  ...initialOnboardingResourceDetails,
  email: '',
};

@Injectable({
  providedIn: 'root',
})
export class ResourceTrackerGlobalDataService {
  private client:any = '';

  private _onboardingList = new BehaviorSubject<OnboardingList>({});
  onboardingList$ = this._onboardingList.asObservable();

  private _offboardingList = new BehaviorSubject<OffboardingList>({});
  offboardingList$ = this._offboardingList.asObservable();

  private _onboardingResource = new BehaviorSubject<OnboardingResource>(
    initialOnboardingResourceDetails,
  );
  onboardingResource$ = this._onboardingResource.asObservable();

  private _offboardingResource = new BehaviorSubject<OffboardingResource>(
    initialOffboardingResourceDetails,
  );
  offboardingResource$ = this._offboardingResource.asObservable();

  private _onboardingRowCountByStatus =
    new BehaviorSubject<OnboardingRowCountByStatus>({});
  onboardingRowCountByStatus$ = this._onboardingRowCountByStatus.asObservable();

  private _offboardingRowCountByStatus =
    new BehaviorSubject<OffboardingRowCountByStatus>({});
  offboardingRowCountByStatus$ =
    this._offboardingRowCountByStatus.asObservable();

  private apiStatuses: Array<ApiStatus> = [];

  constructor(
    private uiService: UIService,
    private toastService: ToastService,
    private userProfileService: UserProfileService,
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

  async getOnboardingParentTickets(
    startIndex = 1,
    pageSize = recordsPerPage.defaultSize,
    searchText = '',
    onboardingStatuses?: Array<string>,
    sortDirection = 'desc',
    sortColumn = 'formatted_updated_date',
    columnFilters: any = []
  ) {
    try {
      this.uiService.setLoader(true);
      const response = await this.client.queries.shootResourceTrackerQuery({
        module: 'onboarding',
        searchText,
        startIndex: startIndex - 1,
        pageSize,
        onboardingStatuses,
        supervisorEmail: this.getOnboardingSupervisorEmail(),
        sortDirection,
        sortColumn,
        columnFilters: JSON.stringify(columnFilters)
      });

      const { data, errors } = response;

      if (errors?.length) {
        let onboardingList = this._onboardingList.getValue();
        onboardingList = {
          ...onboardingList,
          pagination: {
            startIndex: 0,
            pageSize: recordsPerPage.defaultSize,
            totalCount: 0,
          },
        };

        this._onboardingList.next(onboardingList);
        throw new Error(errors[0].message);
      }

      const results = JSON.parse(String(data));

      const { totalCount, queryResult, statusCode, message } = results;

      if (statusCode === 520) {
        let onboardingList = this._onboardingList.getValue();
        onboardingList = {
          ...onboardingList,
          pagination: {
            startIndex: 0,
            pageSize: recordsPerPage.defaultSize,
            totalCount: 0,
          },
        };

        this._onboardingList.next(onboardingList);
        throw new Error(message);
      }

      let onboardingList = this._onboardingList.getValue();
      onboardingList = {
        ...onboardingList,
        pagination: {
          startIndex,
          pageSize,
          totalCount,
        },
        data: queryResult,
        searchText,
        sorting: {prop: sortColumn, dir: sortDirection},
        selectedOnboardingStatuses: onboardingStatuses,
        columnFilters: columnFilters
      };

      this._onboardingList.next(onboardingList);
      this.setApiResponse('onboarding', 200);
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

  async getEmployeeCustomDetails() {
    try {
      this.uiService.setLoader(true);
      const response = await this.client.queries.shootResourceTrackerQuery({
        module: 'rt-employee-custom-details',
        queryParams:  JSON.stringify({
          employeeWorkerId: '000094'
        })
      });

      const { data, errors } = response;

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      const results = JSON.parse(String(data));

      const { queryResult, statusCode, message } = results;

      if (statusCode === 520) {
        throw new Error(message);
      }

      return queryResult || []
    } catch (err: any) {
      console.error(err)
      return []
    } 
  }

  async onboardingRowCountByStatus(searchText = '', columnFilters: ColumnFilter[] = [] ) {
    try {
      const response = await this.client.queries.shootResourceTrackerQuery({
        module: 'onboarding-row-count-by-status',
        searchText,
        columnFilters: JSON.stringify(columnFilters),
        supervisorEmail: this.getOnboardingSupervisorEmail(),
      });

      const { data, errors } = response;

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      const results = JSON.parse(String(data));

      const { queryResult, statusCode, message } = results;

      if (statusCode === 520) {
        throw new Error(message);
      }

      this._onboardingRowCountByStatus.next(queryResult);
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
        time: 20,
      });
    }
  }

  async getOnboardingDetails(parentTicketId: string) {
    try {
      // parent ticket is = response ticket number
      this.uiService.setLoader(true);
      // Query to get the total count
      const response = await this.client.queries.shootResourceTrackerQuery({
        module: 'onboarding-details',
        parentTicketId,
      });

      const { data, errors } = response;

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      const queryResult = JSON.parse(String(data));

      const { onboardingResource, statusCode, message } = queryResult;
      
      if (statusCode === 520) {
        throw new Error(message);
      }
      
      // const employeeCustomDetails: any = await this.getEmployeeCustomDetails();
      // console.log("TCL: ResourceTrackerGlobalDataService -> getOnboardingDetails -> employeeCustomDetails", employeeCustomDetails)
      
      // //   custom task function name customTasks
      // if(!onboardingResource?.parentTicket){
      //   onboardingResource.parentTicket.childTickets = [...employeeCustomDetails.tasks]
      // }
      // else{
      //   onboardingResource.parentTicket.childTickets = [...onboardingResource.parentTicket.childTickets, ...employeeCustomDetails.tasks]
      // }
      
      // console.log("TCL: ResourceTrackerGlobalDataService -> getOnboardingDetails -> onboardingResource", onboardingResource)
      this._onboardingResource.next(onboardingResource);
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

  async getOffboardingParentTickets(
    startIndex = 1,
    pageSize = recordsPerPage.defaultSize,
    searchText = '',
    offboardingStatuses?: Array<string>,
    sortDirection = 'desc',
    sortColumn = 'formatted_updated_date',
    columnFilters: any = []
  ) {
    try {
      this.uiService.setLoader(true);
      const response = await this.client.queries.shootResourceTrackerQuery({
        module: 'offboarding',
        searchText,
        startIndex: startIndex - 1,
        pageSize,
        offboardingStatuses,
        supervisorEmail: this.getOffboardingSupervisorEmail(),
        sortDirection,
        sortColumn,
        columnFilters: JSON.stringify(columnFilters)
      });

      const { data, errors } = response;

      if (errors?.length) {
        let offboardingList = this._offboardingList.getValue();
        offboardingList = {
          ...offboardingList,
          pagination: {
            startIndex: 0,
            pageSize: recordsPerPage.defaultSize,
            totalCount: 0,
          },
        };

        this._offboardingList.next(offboardingList);
        throw new Error(errors[0].message);
      }

      const results = JSON.parse(String(data));

      const { totalCount, queryResult, statusCode, message } = results;

      if (statusCode === 520) {
        let offboardingList = this._offboardingList.getValue();
        offboardingList = {
          ...offboardingList,
          pagination: {
            startIndex: 0,
            pageSize: recordsPerPage.defaultSize,
            totalCount: 0,
          },
        };

        this._offboardingList.next(offboardingList);
        throw new Error(message);
      }

      let offboardingList = this._offboardingList.getValue();
      offboardingList = {
        ...offboardingList,
        pagination: {
          startIndex,
          pageSize,
          totalCount,
        },
        data: queryResult,
        searchText,
        selectedOffboardingStatuses: offboardingStatuses,
        sorting: {prop: sortColumn, dir: sortDirection},
        columnFilters: columnFilters.length ? columnFilters : []
      };

      this._offboardingList.next(offboardingList);
      this.setApiResponse('offboarding', 200);
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

  async getOffboardingDetails(parentTicketId: string) {
    try {
      // parent ticket is = response ticket number
      this.uiService.setLoader(true);
      // Query to get the total count
      const response = await this.client.queries.shootResourceTrackerQuery({
        module: 'offboarding-details',
        parentTicketId,
      });

      const { data, errors } = response;

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      const queryResult = JSON.parse(String(data));

      const { offboardingResource, statusCode, message } = queryResult;

      if (statusCode === 520) {
        throw new Error(message);
      }
      this._offboardingResource.next(offboardingResource);
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

  async offboardingRowCountByStatus(searchText = '', columnFilters: ColumnFilter[] = [] ) {
    try {
      const response = await this.client.queries.shootResourceTrackerQuery({
        module: 'offboarding-row-count-by-status',
        searchText,
        supervisorEmail: this.getOffboardingSupervisorEmail(),
      });

      const { data, errors } = response;

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      const results = JSON.parse(String(data));

      const { queryResult, statusCode, message } = results;

      if (statusCode === 520) {
        throw new Error(message);
      }

      this._offboardingRowCountByStatus.next(queryResult);
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
        time: 20,
      });
    }
  }

  getOnboardingSupervisorEmail() {
    const loggedInUserEmail =
      this.userProfileService.getLoggedInUserDetails()?.email;
    const onboardingResourceType =
      localStorage.getItem('onboardingResourceType') || '';
    return onboardingResourceType === 'My Resources' && loggedInUserEmail
      ? loggedInUserEmail
      : '';
  }

  getOffboardingSupervisorEmail() {
    const loggedInUserEmail =
      this.userProfileService.getLoggedInUserDetails()?.email;
    const offboardingResourceType =
      localStorage.getItem('offboardingResourceType') || '';
    return offboardingResourceType === 'My Resources' && loggedInUserEmail
      ? loggedInUserEmail
      : '';
  }

  clearOnboardingResourceDetails() {
    this._onboardingResource.next(initialOnboardingResourceDetails);
  }

  clearOnboardingFilters() {
    let onboardingList = this._onboardingList.getValue();
    onboardingList = {
      ...onboardingList,
      searchText: '',
      selectedOnboardingStatuses: [],
    };

    this._onboardingList.next(onboardingList);
  }

  setOnboardingSearchFilter(searchText?: string) {
    this.updateOnboardingList('searchText', searchText || '');
  }

  setOnboardingStatus(status = '') {
    const onboardingList = this._onboardingList.getValue();
    const index = onboardingList.selectedOnboardingStatuses?.indexOf(status);

    if (!onboardingList.selectedOnboardingStatuses) {
      onboardingList.selectedOnboardingStatuses = [];
    }

    if (index !== undefined && index !== -1) {
      onboardingList.selectedOnboardingStatuses?.splice(index, 1);
    } else {
      onboardingList.selectedOnboardingStatuses?.push(status);
    }

    this.updateOnboardingList(
      'selectedOnboardingStatuses',
      onboardingList.selectedOnboardingStatuses,
    );
  }

  setOnboardingResourceType(type = '') {
    localStorage.setItem('onboardingResourceType', type);
  }

  setOffboardingResourceType(type = '') {
    localStorage.setItem('offboardingResourceType', type);
  }

  setOnboardingSortOrder(sorting?: any) {
    this.updateOnboardingList('sorting', {
      order: sorting.order || '',
      column: sorting.column || '',
    });
  }

  updateOnboardingList(key: string, value: any) {
    const onboardingList = this._onboardingList.getValue();
    onboardingList[key] = value;
    this._onboardingList.next(onboardingList);
  }

  updateOffboardingList(key: string, value: any) {
    const offboardingList = this._offboardingList.getValue();
    offboardingList[key] = value;
    this._offboardingList.next(offboardingList);
  }

  clearOffboardingResourceDetails() {
    this._offboardingResource.next(initialOffboardingResourceDetails);
  }

  clearOffboardingFilters() {
    let offboardingList = this._offboardingList.getValue();
    offboardingList = {
      ...offboardingList,
      searchText: '',
      selectedOffboardingStatuses: [],
    };

    this._offboardingList.next(offboardingList);
  }

  setOffboardingSearchFilter(searchText?: string) {
    this.updateOffboardingList('searchText', searchText || '');
  }

  setOffboardingStatus(status = '') {
    const offboardingList = this._offboardingList.getValue();
    const index = offboardingList.selectedOffboardingStatuses?.indexOf(status);

    if (!offboardingList.selectedOffboardingStatuses) {
      offboardingList.selectedOffboardingStatuses = [];
    }

    if (index !== undefined && index !== -1) {
      offboardingList.selectedOffboardingStatuses?.splice(index, 1);
    } else {
      offboardingList.selectedOffboardingStatuses?.push(status);
    }
    this.updateOffboardingList(
      'selectedOffboardingStatuses',
      offboardingList.selectedOffboardingStatuses,
    );
  }

  setOffboardingSortOrder(sorting?: any) {
    this.updateOffboardingList('sorting', {
      order: sorting.order || '',
      column: sorting.column || '',
    });
  }

  getOnboardingList() {
    return this._onboardingList.getValue() || {};
  }

  getOffboardingList() {
    return this._offboardingList.getValue() || {};
  }
}
