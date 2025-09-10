import { Injectable } from '@angular/core';
import {
  BehaviorSubject
} from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';
import { ToastrService } from 'ngx-toastr';
import { ToastService } from 'src/app/common/services/toast.service';
import { messages } from '../constants/messages.constant';
import { UserProfileService } from '@app/common/services/user-profile.service';
import { GlobalDataService as GS } from 'src/app/common/services/global-data.service';
import {
  recordsPerPage,
} from '../constants/global.constant';
import { AddApplicationPayload, AddLifeCyclePayload, AddVendorPayload, ApiStatus, ApplicationDetailsPayload, ConfigurationsDetailsPayload, DeleteApplicationPayload, DeleteLifeCyclePayload, DeleteVendorPayload, DepartmentSearchPyaload, DownloadFilePayload, GetListPayload, LifeCycleDetailsPayload, LifecycleSearchPayload, UpdateApplicationPayload, UpdateConfigurationsPayload, UpdateLifeCyclePayload, UpdateVendorPayload, UserSearchPayload, VendorDetailsPayload, VendorSearchPayload } from '../interfaces/global.interface';
import { RestApiService } from '@app/common/services/rest-api.service';

const defaultErrorBlock = {
  statusCode: 0,
  statusMessage: '',
  statusDescription: '',
};

@Injectable({
  providedIn: 'root',
})
export class AsherGlobalDataService {
  private apiStatuses: Array<ApiStatus> = [];

  // Holds and emits the list of Application records along with pagination and loading status.
  private _applications = new BehaviorSubject<any>({
    rows: [],
    pagination: {
      startIndex: 0,
      pageSize: recordsPerPage.defaultSize,
      totalCount: 0,
    },
    loaded: false
  });
  applications$ = this._applications.asObservable();

  // Holds and emits the list of Asher user records with pagination and loading status.
  private _users = new BehaviorSubject<any>({
    rows: [],
    pagination: {
      startIndex: 0,
      pageSize: recordsPerPage.defaultSize,
      totalCount: 0,
    },
    loaded: false
  });
  users$ = this._users.asObservable();

  // Holds and emits the list of lifecycle records along with pagination and loading status.
  private _lifecycleResults = new BehaviorSubject<any>({
    rows: [],
    pagination: {
      startIndex: 0,
      pageSize: recordsPerPage.defaultSize,
      totalCount: 0,
    },
    loaded: false
  });
  lifecycleResults$ = this._lifecycleResults.asObservable();

  // Holds and emits the list of vendor records along with pagination and loading status.
  private _vendorsResults = new BehaviorSubject<any>({
    rows: [],
    pagination: {
      startIndex: 0,
      pageSize: recordsPerPage.defaultSize,
      totalCount: 0,
    },
    loaded: false
  });
  vendorsResults$ = this._vendorsResults.asObservable();

  // Holds and emits the list of department records with pagination and loading status.
  private _departmentsResults = new BehaviorSubject<any>({
    rows: [],
    pagination: {
      startIndex: 0,
      pageSize: recordsPerPage.defaultSize,
      totalCount: 0,
    },
    loaded: false
  });
  departmentsResults$ = this._departmentsResults.asObservable();

  // Holds and emits detailed information for a single Asher entity.
  private _asherDetails = new BehaviorSubject<any>([]);
  asherDetails$ = this._asherDetails.asObservable();

  // Holds and emits detailed information for a single lifecycle entity.
  private _lifeCycleDetails = new BehaviorSubject<any>({});
  lifeCycleDetails$ = this._lifeCycleDetails.asObservable();

  // Holds and emits detailed information for a single vendor entity.
  private _vendorDetails = new BehaviorSubject<any>({});
  vendorDetails$ = this._vendorDetails.asObservable();

  // Holds and emits detailed information for a single dashboard entity.
  private _dashboardDetails = new BehaviorSubject<any>({
    rows: [],
    pagination: {
      startIndex: 0,
      pageSize: recordsPerPage.defaultSize,
      totalCount: 0,
    },
    loaded: false
  });
  dashboardDetails$ = this._dashboardDetails.asObservable();


  private _isChartLoading = new BehaviorSubject<boolean>(false);
  isChartLoading$ = this._isChartLoading.asObservable();

  // Holds and emits the list of department records with pagination and loading status.
  private _configurationsResults = new BehaviorSubject<any>({
    rows: [],
    pagination: {
      startIndex: 0,
      pageSize: recordsPerPage.defaultSize,
      totalCount: 0,
    },
    loaded: false
  });
  configurationsResults$ = this._configurationsResults.asObservable();

  // Holds and emits detailed information for a single Asher entity.
  private _configurationsDetails = new BehaviorSubject<any>([]);
  configurationsDetails$ = this._configurationsDetails.asObservable();

  constructor(
    private gs: GS,
    private uiService: UIService,
    private toastr: ToastrService,
    private toastService: ToastService,
    private userProfileService: UserProfileService,
    private restApiService: RestApiService
  ) { }

  /**
   * Checks if data should be reloaded based on the API code status.
   * Returns true if the API status does not exist or has no status code.
   *
   * @param {string} apiCode - The code of the API.
   * @returns {boolean}
   */
  reloadData(apiCode: string) {
    const thisApiStatus = this.apiStatuses.find(
      (apiStatus: ApiStatus) =>
        apiStatus.apiCode === apiCode && apiStatus.statusCode,
    );
    return !thisApiStatus?.apiCode ? true : false;
  }

  /**
   * Stores or updates the status code of a given API code in the apiStatuses array.
   *
   * @param {string} apiCode - The code of the API.
   * @param {number} statusCode - The response status code of the API.
   */
  setApiResponse(apiCode: string, statusCode: number) {
    const apiStatus = {
      apiCode: apiCode,
      statusCode: statusCode,
    };

    const thisApiStatusIndex = this.apiStatuses.findIndex(
      (apiStatus: ApiStatus) => apiStatus.apiCode === apiCode,
    );
    if (thisApiStatusIndex > -1) {
      this.apiStatuses[thisApiStatusIndex] = apiStatus;
    } else {
      this.apiStatuses.push(apiStatus);
    }
  }

  /**
   * Fetches the list of Asher applications based on pagination, sorting, filtering, and search parameters.
   * The results are transformed, stored in a BehaviorSubject, and used to update the UI state.
   *
   * @param {GetListPayload} [payload] - Optional object that includes pagination, sorting, search, and column filters.
   */
  async getApplicationList(payload?: GetListPayload) {
    try {
      // Show loader while data is being fetched
      this.uiService.setLoader(true);

      //Builds a query string and search parameters object from the given payload.
      const {queryParams} = this.buildQueryString(payload);

      const asherList = await this.restApiService.getRequest({
        path: `asher/applications`,
        queryParams: queryParams
      });

      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(asherList, payload, queryParams);

      // Emit the fetched results to the BehaviorSubject after mapping
      this._applications.next(formattedResponse);
      // Store successful API response status
      this.setApiResponse('applications', asherList?.statusCode || 200);
    } catch (err: any) {
      // Log error and set fallback API response
      this.logError(err);
      this.setApiResponse('applications', err.statusCode || 520);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Fetches the list of lifecycle entities from the backend using provided payload parameters
   * such as pagination, sorting, search text, and column filters.
   * 
   * - Maps API response fields to frontend model format.
   * - Updates `_lifecycleResults` BehaviorSubject with the retrieved data.
   * - Tracks API status for reload decisions and error handling.
   * - Shows/hides a UI loader during the request lifecycle.
   * 
   * @param {GetListPayload} [payload] - Optional data for pagination, sorting, global search, and column-based filtering.
   */
  async getLifeCyclesList(payload?: GetListPayload) {
    try {
      this.uiService.setLoader(true);

      //Builds a query string and search parameters object from the given payload.
      const { queryParams } = this.buildQueryString(payload);

      const lifeCycleList = await this.restApiService.getRequest({
        path: `asher/lifecycles`,
        queryParams: queryParams
      });

      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(lifeCycleList, payload, queryParams);

      this._lifecycleResults.next(formattedResponse);
      this.setApiResponse('lifecycles', lifeCycleList.statusCode || 200);
    } catch (err: any) {
      this.logError(err);
      this.setApiResponse('lifecycles', err.statusCode || 520);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Fetches the list of vendors from the backend API based on provided payload parameters.
   * 
   * - Supports pagination, sorting, global search, and column-based filtering.
   * - Maps the API response fields to the frontend vendor model.
   * - Updates the `_vendorsResults` BehaviorSubject with the formatted data.
   * - Tracks the API status for reload logic and error handling.
   * - Displays a loader during the API call.
   * 
   * @param {GetListPayload} [payload] - Optional object containing pagination info, sorting, filters, and search text.
   */
  async getVendorsList(payload?: GetListPayload) {
    try {
      this.uiService.setLoader(true);

      //Builds a query string and search parameters object from the given payload.
      const { queryParams } = this.buildQueryString(payload);

      const vendorsList = await this.restApiService.getRequest({
        path: `asher/vendors`,
        queryParams: queryParams
      });

      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(vendorsList, payload, queryParams);

      this._vendorsResults.next(formattedResponse);
      this.setApiResponse('vendors', vendorsList.statusCode || 200);
    } catch (err: any) {
      this.logError(err);
      this.setApiResponse('vendors', err.statusCode || 520);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Fetches the list of departments from the backend API using filters, pagination, sorting, and global search.
   * 
   * - Defaults to sorting by `last_modified_at` in descending order if not specified.
   * - Applies column-level filters and global search if provided.
   * - Transforms the API response data into the frontend `departmentsModel` format.
   * - Updates `_departmentsResults` BehaviorSubject with the formatted result.
   * - Manages UI loading state and API response tracking.
   * 
   * @param {GetListPayload} [payload] - Optional input for pagination, sorting, filters, and search string.
   */
  async getDepartmentList(payload?: GetListPayload) {
    try {
      this.uiService.setLoader(true);

      //Builds a query string and search parameters object from the given payload.
      const { queryParams } = this.buildQueryString(payload);
      
      const departmentsList = await this.restApiService.getRequest({
        path: `asher/departments`,
        queryParams: queryParams
      });
      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(departmentsList, payload, queryParams);

      this._departmentsResults.next(formattedResponse);
      this.setApiResponse('departments', departmentsList.statusCode || 200);
    } catch (err: any) {
      this.logError(err);
      this.setApiResponse('departments', err.statusCode || 520);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Fetches a list of users for use in a select/dropdown field with optional search capability.
   *
   * - By default, returns the first 20 users sorted by `fullname_preferred` in ascending order.
   * - If a `searchTerm` is provided, performs an OR search across multiple user fields:
   *   `fullname_preferred`, `email`, `worker_id`, and `network_id`.
   * - Loader visibility can be toggled based on the `payload.showLoader` flag.
   * - The result is a list of users or an empty array if no users match the search.
   * - Handles API errors gracefully and ensures loader state is reset in all cases.
   * 
   * @param {UserSearchPayload} [payload] - Contains optional `searchTerm` and `showLoader` flag.
   * @returns {Promise<any[]>} - A promise resolving to a filtered list of users.
   */
  async getUsersForSelectField(payload?: UserSearchPayload) {
    if (payload?.showLoader) {
      this.uiService.setLoader(true);
    }
    const searchParams: any = {
      pageIndex: 0,
      pageSize: 20,
      sortColumn: 'fullname_preferred',
      sortDirection: 'asc',
    };
    let searchTerm = payload?.searchTerm || '';
    if (searchTerm) {
      // code for column level search
      const columnsToSearch = ['fullname_preferred', 'email', 'network_id'];

      const columnFilters = columnsToSearch.map((name) => ({
        columnName: name,
        filterType: 'multi-text',
        conditions: [{
          searchTags: [searchTerm],
          type: 'contains'
        }],
        operator: 'or'
      }));
      searchParams.columnFilters = JSON.stringify(columnFilters);
      if (columnFilters?.length) {
        searchParams.globalColumnFilterOperator = 'OR';
      }
    }

    const queryString = new URLSearchParams(
      Object.entries(searchParams),
    ).toString();

    try {
      const apiUsers = await this.restApiService.getRequest({
        path: `asher/applications${payload?.authorityType === 'it' ? '/itcontacts' : '/authorities'}?${queryString}`
      });
      return apiUsers['data']?.length > 0 ? apiUsers['data'] : [];
    } catch (err: any) {
      this.logError(err);
      return;
    } finally {
      if (payload?.showLoader) {
        this.uiService.setLoader(false);
      }
    }
  }

  /**
   * Fetches a list of vendors with optional global search capability.
   *
   * - Returns the first 20 vendors sorted by `vendor_name` in ascending order.
   * - If a `searchTerm` is provided, it is applied as a global search.
   * - Loader visibility is controlled using the `payload.showLoader` flag.
   * - The result is mapped to a simplified structure containing `id` and `name`.
   * - Handles API errors gracefully and ensures loader state is reset properly.
   * 
   * @param {VendorSearchPayload} [payload] - Contains optional `searchTerm` and `showLoader` flag.
   * @returns {Promise<Array<{ id: string, name: string }>>} - A promise resolving to a list of vendors.
   */
  async getVendors(payload?: VendorSearchPayload) {
    if (payload?.showLoader) {
      this.uiService.setLoader(true);
    }
    const searchParams: any = {
      pageIndex: 0,
      pageSize: 20,
      sortColumn: 'vendor_name',
      sortDirection: 'asc',
    };
    let searchTerm = payload?.searchTerm || '';
    if (searchTerm) {
      searchParams.globalSearch = searchTerm;
    }

    const queryString = new URLSearchParams(
      Object.entries(searchParams),
    ).toString();

    try {
      const apiVendors = await this.restApiService.getRequest({
        path: `asher/vendors?${queryString}`
      });
      return apiVendors['data']?.length > 0 ? apiVendors['data']?.map((vendor: any) => {
        return {
          id: vendor?.vendor_id,
          name: vendor?.vendor_name
        }
      }) : [];
    } catch (err: any) {
      this.logError(err);
      return;
    } finally {
      if (payload?.showLoader) {
        this.uiService.setLoader(false);
      }
    }
  }

  /**
   * Fetches a list of lifecycles with optional search capability.
   *
   * - Returns the first 20 lifecycles sorted by `name` in ascending order.
   * - If a `searchTerm` is provided, it performs a column-level search on `code` and `name`.
   * - Loader visibility is controlled using the `payload.showLoader` flag.
   * - The result is returned as a list of lifecycle data.
   * - Handles API errors gracefully and ensures loader state is reset properly.
   * 
   * @param {LifecycleSearchPayload} [payload] - Contains optional `searchTerm` and `showLoader` flag.
   * @returns {Promise<any[]>} - A promise resolving to a list of lifecycles.
   */
  async getLifecycles(payload?: LifecycleSearchPayload) {
    if (payload?.showLoader) {
      this.uiService.setLoader(true);
    }
    const searchParams: any = {
      pageIndex: 0,
      pageSize: 20,
      sortColumn: 'name',
      sortDirection: 'asc',
    };
    let searchTerm = payload?.searchTerm || '';
    if (searchTerm) {
      searchParams.globalSearch = searchTerm;
    }

    const queryString = new URLSearchParams(
      Object.entries(searchParams),
    ).toString();

    try {
      const apiLifecycles = await this.restApiService.getRequest({
        path: `asher/lifecycles?${queryString}`
      });
      return apiLifecycles?.data || [];
    } catch (err: any) {
      this.logError(err);
      return;
    } finally {
      if (payload?.showLoader) {
        this.uiService.setLoader(false);
      }
    }
  }

  /**
   * Fetches a list of departments with optional search capability.
   *
   * - Returns the first 20 departments sorted by `department_name` in ascending order.
   * - If a `searchTerm` is provided, it performs a global search on the department names.
   * - Loader visibility is controlled using the `payload.showLoader` flag.
   * - The result is returned as a list of department data with `id` and `name` properties.
   * - Handles API errors gracefully and ensures loader state is reset properly.
   * 
   * @param {DepartmentSearchPayload} [payload] - Contains optional `searchTerm` and `showLoader` flag.
   * @returns {Promise<any[]>} - A promise resolving to a list of departments.
   */
  async getDepartments(payload?: DepartmentSearchPyaload) {
    if (payload?.showLoader) {
      this.uiService.setLoader(true);
    }
    const searchParams: any = {
      pageIndex: 0,
      pageSize: 20,
      sortColumn: 'department_name',
      sortDirection: 'asc',
    };
    let searchTerm = payload?.searchTerm || '';
    if (searchTerm) {
      searchParams.globalSearch = searchTerm;
    }

    const queryString = new URLSearchParams(
      Object.entries(searchParams),
    ).toString();

    try {
      const apiDepartments = await this.restApiService.getRequest({
        path: `asher/departments?${queryString}`
      });
      return apiDepartments['data']?.length > 0 ? apiDepartments['data']?.map((departments: any) => {
        return {
          id: departments?.id,
          name: departments?.['department_name']
        }
      }) : [];
    } catch (err: any) {
      this.logError(err);
      return;
    } finally {
      if (payload?.showLoader) {
        this.uiService.setLoader(false);
      }
    }
  }

  /**
   * Fetches detailed information of an application by its ID.
   *
   * - Makes an API call to fetch application details based on the provided `payload.id`.
   * - If the application details are found, they are mapped using `mapping()` and stored in the `_asherDetails` subject.
   * - If no data is found, an error is thrown with a corresponding message.
   * - Handles errors gracefully by logging them and ensures the loader state is properly set.
   * 
   * @param {ApplicationDetailsPayload} payload - Contains the `id` of the application to fetch details for.
   * @returns {Promise<any | undefined>} - A promise resolving to the application details, or undefined if an error occurs.
   */
  async getApplicationDetails(payload: ApplicationDetailsPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.restApiService.getRequest({
        path: `asher/applications/${payload.id}`
      });
      const apiApplicationDetails = result?.data || null;
      if (!apiApplicationDetails) {
        throw new Error(messages.error.asher.notFound);
      }

      const transformedDetails = {
        ...apiApplicationDetails,
        product_manager: apiApplicationDetails?.product_managers?.map((pm: any) => pm.id) || [],
        product_owner: apiApplicationDetails?.product_owners?.map((po: any) => po.id) || [],
        system_owner: apiApplicationDetails?.system_owners?.map((so: any) => so.id) || [],
        business_owner: apiApplicationDetails?.business_owners?.map((bo: any) => bo.id) || [],
        it_contact: apiApplicationDetails?.it_contacts?.map((ic: any) => ic.id) || [],
      }

      this._asherDetails.next(transformedDetails);
      return transformedDetails;
    } catch (err: any) {
      this.logError(err);
      return;
    }
    finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Updates the details of an application.
   *
   * - Makes an API PUT request to update the application information with the provided `payload` details.
   * - Sends updated details such as `applicationName`, `businessOwnerId`, `life_cycle`, etc., to the backend.
   * - If the update is successful, a success message is displayed via a toast notification, and the application list is refreshed.
   * - If an error occurs during the update, it is logged, and the loader state is set appropriately.
   * 
   * @param {UpdateApplicationPayload} payload - Contains the updated data for the application.
   * @returns {Promise<void>} - A promise resolving when the update operation is complete.
   */
  async updateApplication(payload: UpdateApplicationPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.restApiService.putRequest({
        path: `asher/applications`,
        body: {
          data: {
            id: payload.id,
            app_name: payload.app_name,
            business_owner: payload.business_owner,
            system_owner: payload.system_owner,
            life_cycle: payload.life_cycle,
            aliases: payload.aliases,
            hosting_location: payload.hosting_location,
            vendor_id: payload.vendor_id,
            app_desc: payload.app_desc,
            is_gxp: payload.is_gxp,
            is_sox: payload.is_sox,
            it_contact: payload.it_contact?.length ? payload.it_contact : null,
            product_owner: payload.product_owner?.length ? payload.product_owner : null,
            product_manager: payload.product_manager?.length ? payload.product_manager : null,
            approver1: payload?.approver1 || null,
            sponsor: payload?.sponsor || null,
            version: payload?.version || null,
            user_info: this.userProfileService.getUserInfoForTracking(),
            record_status: 'active',
          }
        }
      });

      const applicationFilters = this._applications.getValue()


      const filterListingPayload: GetListPayload = {
        globalSearch: applicationFilters?.searchText || '',
        sortColumn: applicationFilters?.sorting?.prop || 'last_modified_at',
        sortDirection: applicationFilters?.sorting?.dir || 'desc',
        columnFilters: applicationFilters?.columnFilters || [],
        pagination:{
          pageIndex: applicationFilters?.pagination?.startIndex || 1,
          pageSize: applicationFilters?.pagination?.pageSize || 50
        },
      }
      this.getApplicationList(filterListingPayload);

      this.toastService.fire({
        type: 'success',
        message: result?.statusDescription || 'Success!',
      });
      result.id = payload.id;
      return result;
    } catch (err: any) {
      this.logError(err);
      this.uiService.setLoader(false);
      return {};
    }
  }

  // Filters out null, undefined, empty, or zero-length values from an object.
  filterPayload(payload: AddApplicationPayload | UpdateApplicationPayload) {
    return Object.fromEntries(
      Object.entries(payload)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '' && value?.length !== 0)
    );
  }

  /**
   * Adds a new application.
   *
   * - Makes an API POST request to add a new application with the provided `payload` details.
   * - Sends information like `applicationName`, `businessOwnerId`, `life_cycle`, etc., to the backend.
   * - If the addition is successful, a success message is shown via a toast notification, and the application list is refreshed.
   * - If an error occurs during the addition, it is logged, and the loader state is set accordingly.
   * 
   * @param {AddAsherPayload} payload - Contains the details of the application to be added.
   * @returns {Promise<any>} - A promise resolving to the result of the API call (e.g., application details or status).
   */
  async addApplication(payload: AddApplicationPayload) {
    try {
      this.uiService.setLoader(true);

      const result = await this.restApiService.postRequest({
        path: `asher/applications`,
        body: {
          data: {
            app_name: payload.app_name,
            business_owner: payload.business_owner,
            system_owner: payload.system_owner,
            life_cycle: payload.life_cycle,
            aliases: payload.aliases,
            hosting_location: payload.hosting_location,
            vendor_id: payload.vendor_id,
            app_desc: payload.app_desc,
            it_contact: payload?.it_contact?.length ? payload.it_contact : undefined,
            product_owner: payload?.product_owner?.length ? payload.product_owner : undefined,
            product_manager: payload?.product_manager?.length ? payload.product_manager : undefined,
            approver1: payload?.approver1 || undefined,
            sponsor: payload?.sponsor || undefined,
            version: payload?.version || undefined,
            is_gxp: payload?.is_gxp,
            is_sox: payload?.is_sox,
            user_info: this.userProfileService.getUserInfoForTracking(),
            record_status: 'active',
          },
        }
      });
      this.toastService.fire({
        type: 'success',
        message: result?.statusDescription || 'Success!',
      });
      this.getApplicationList();
      return result;
    } catch (err: any) {
      this.logError(err);
      this.uiService.setLoader(false);
      return {};
    }
  }

  /**
   * Deletes an existing application.
   *
   * - Makes an API DELETE request to remove an application based on the provided `payload.id`.
   * - Sends the application's `id` and user information (like email) to the backend.
   * - If the deletion is successful, a success message is shown via a toast notification, and the application list is refreshed.
   * - If an error occurs during the deletion, it is logged, and the loader state is set accordingly.
   * 
   * @param {DeleteApplicationPayload} payload - Contains the `id` of the application to be deleted.
   * @returns {Promise<any>} - A promise resolving to the result of the API call (e.g., deletion status or message).
   */
  async deleteApplication(payload: DeleteApplicationPayload) {
    try {
      this.uiService.setLoader(true);
      await this.restApiService.deleteRequest({
        path: `asher/applications/${payload.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this.toastService.fire({
        type: 'success',
        message: 'Application deleted successfully!',
      });
      this.getApplicationList();
    } catch (err: any) {
      this.logError(err);
      this.uiService.setLoader(false);
    }
  }

  /**
   * Retrieves the details of a specific lifecycle.
   *
   * - Makes an API GET request to fetch the lifecycle details using the provided `payload.code`.
   * - If the lifecycle details are found, they are mapped and updated in the `_lifeCycleDetails` observable.
   * - If the lifecycle is not found or an error occurs, an error is thrown or logged.
   * - A loader is displayed while the request is in progress and hidden once the request completes or fails.
   * 
   * @param {LifeCycleDetailsPayload} payload - Contains the `code` of the lifecycle whose details are to be fetched.
   * @returns {Promise<any>} - A promise resolving to the lifecycle details or `null` if not found.
   */
  async getLifeCycleDetails(payload: LifeCycleDetailsPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.restApiService.getRequest({
        path: `asher/lifecycles/${payload.code}`
      });
      const apiLifeCycleDetails = result?.data || null;

      if (!apiLifeCycleDetails) {
        throw new Error(messages.error.asher.notFound);
      }

      this._lifeCycleDetails.next(apiLifeCycleDetails);
      return apiLifeCycleDetails;
    } catch (err: any) {
      this.logError(err);
      return;
    }
    finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Updates the details of a specific lifecycle.
   *
   * - Sends an API PUT request to update the lifecycle with the provided `payload.id`, `lc_name`, and `description`.
   * - If the update is successful, it triggers a success toast notification.
   * - Upon successful update, the lifecycle list is refreshed by calling `getLifeCyclesList()`.
   * - If an error occurs during the update, the error is logged, and the loader is stopped.
   * - A loader is displayed during the API request.
   *
   * @param {UpdateLifeCyclePayload} payload - Contains the updated lifecycle data (`id`, `lc_name`, `description`).
   */
  async updateLifeCycle(payload: UpdateLifeCyclePayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.restApiService.putRequest({
        path: `asher/lifecycles`,
        body: {
          data: {
            id: payload.id,
            name: payload.name,
            description: payload.description,
            user_info: this.userProfileService.getUserInfoForTracking()
          }
        }
      });

      this.toastService.fire({
        type: 'success',
        message: result?.statusDescription || 'Success!',
      });
      const lifeCycleFilters = this._lifecycleResults.getValue();

      const filterlifeCycleListingPayload: GetListPayload = {
        globalSearch: lifeCycleFilters?.searchText || '',
        sortColumn: lifeCycleFilters?.sorting?.prop || 'last_modified_at',
        sortDirection: lifeCycleFilters?.sorting?.dir || 'desc',
        columnFilters: lifeCycleFilters?.columnFilters || [],
        pagination:{
          pageIndex: lifeCycleFilters?.pagination?.startIndex || 1,
          pageSize: lifeCycleFilters?.pagination?.pageSize || 50
        },
      }
      this.getLifeCyclesList(filterlifeCycleListingPayload);
    } catch (err: any) {
      this.logError(err);
      this.uiService.setLoader(false);
    }
  }

  /**
   * Adds a new lifecycle.
   *
   * - Sends an API POST request to add a new lifecycle with the provided `lc_name` and `description`.
   * - The user info is included in the request, pulling the logged-in user's email.
   * - Upon successful creation, a success toast notification is triggered.
   * - The lifecycle list is refreshed by calling `getLifeCyclesList()` after the new lifecycle is added.
   * - If an error occurs during the add operation, the error is logged, and the loader is stopped.
   * - A loader is displayed during the API request to indicate the process is ongoing.
   *
   * @param {AddLifeCyclePayload} payload - Contains the new lifecycle data (`lc_name`, `description`).
   */
  async addLifeCycle(payload: AddLifeCyclePayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.restApiService.postRequest({
        path: `asher/lifecycles`,
        body: {
          data: {
            name: payload.name,
            description: payload?.description || undefined,
            user_info: this.userProfileService.getUserInfoForTracking(),
          }
        },
      });

      this.toastService.fire({
        type: 'success',
        message: result?.statusDescription || 'Success!',
      });
      const lifeCycleFilters = this._lifecycleResults.getValue();

      const filterLifeCycleListingPayload: GetListPayload = {
        globalSearch: lifeCycleFilters?.searchText || '',
        sortColumn: lifeCycleFilters?.prop || 'last_modified_at',
        sortDirection: lifeCycleFilters?.sorting?.dir || 'desc',
        columnFilters: lifeCycleFilters?.sorting?.columnFilters || [],
        pagination:{
          pageIndex: lifeCycleFilters?.pagination?.startIndex || 1,
          pageSize: lifeCycleFilters?.pagination?.pageSize || 50
        },
      }

      this.getLifeCyclesList(filterLifeCycleListingPayload);
      return result;
    } catch (err: any) {
      this.logError(err);
      this.uiService.setLoader(false);
      return [];
    }
  }

  /**
   * Deletes an existing lifecycle.
   *
   * - Makes an API DELETE request to remove an lifecycle based on the provided `payload.id`.
   * - Sends the lifecycle's `id` and user information (like email) to the backend.
   * - If the deletion is successful, a success message is shown via a toast notification, and the lifecycle list is refreshed.
   * - If an error occurs during the deletion, it is logged, and the loader state is set accordingly.
   * 
   * @param {DeleteLifeCyclePayload} payload - Contains the `id` of the lifecycle to be deleted.
   * @returns {Promise<any>} - A promise resolving to the result of the API call (e.g., deletion status or message).
   */
  async deleteLifeCycle(payload: DeleteLifeCyclePayload) {
    try {
      this.uiService.setLoader(true);
      const check = await this.restApiService.deleteRequest({
        path: `asher/lifecycles/${payload.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this.toastService.fire({
        type: 'success',
        message: 'Lifecycle deleted successfully!',
      });

      const lifeCycleFilters = this._lifecycleResults.getValue();

      const filterLifeCycleListingPayload: GetListPayload = {
        globalSearch: lifeCycleFilters?.searchText || '',
        sortColumn: lifeCycleFilters?.sorting?.prop || 'last_modified_at',
        sortDirection: lifeCycleFilters?.sorting?.dir || 'desc',
        columnFilters: lifeCycleFilters?.columnFilters || [],
        pagination:{
          pageIndex: lifeCycleFilters?.pagination?.startIndex || 1,
          pageSize: lifeCycleFilters?.pagination?.pageSize || 50
        },
      }

      this.getLifeCyclesList(filterLifeCycleListingPayload);
    } catch (err: any) {
      this.logError(err);
      this.uiService.setLoader(false);
    }
  }

  /**
   * Retrieves the details of a specific vendor.
   *
   * - Makes an API GET request to fetch the vendor details using the provided `payload.vendor_id`.
   * - If the vendor details are found, they are mapped and updated in the `_vendorDetails` observable.
   * - If the vendor is not found or an error occurs, an error is thrown or logged.
   * - A loader is displayed while the request is in progress and hidden once the request completes or fails.
   * 
   * @param {VendorDetailsPayload} payload - Contains the `vendor_id` of the lifecycle whose details are to be fetched.
   * @returns {Promise<any>} - A promise resolving to the lifecycle details or `null` if not found.
   */
  async getVendorDetails(payload: VendorDetailsPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.restApiService.getRequest({
        path: `asher/vendors/${payload.vendor_id}`
      });
      const apiVendorDetails = result?.data || null;

      if (!apiVendorDetails) {
        throw new Error(messages.error.asher.notFound);
      }

      this._vendorDetails.next(apiVendorDetails);
      return apiVendorDetails;
    } catch (err: any) {
      this.logError(err);
      return;
    }
    finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Updates the details of a specific vendor.
   *
   * - Sends an API PUT request to update the vendor with the provided `payload.id`, `vendor_name`.
   * - If the update is successful, it triggers a success toast notification.
   * - Upon successful update, the vendor list is refreshed by calling `getVendorsList()`.
   * - If an error occurs during the update, the error is logged, and the loader is stopped.
   * - A loader is displayed during the API request.
   *
   * @param {UpdateVendorPayload} payload - Contains the updated vendor data (`vendor_id`, `vendor_name`).
   */
  async updateVendor(payload: UpdateVendorPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.restApiService.putRequest({
        path: `asher/vendors`,
        body: {
          data: {
            id: payload.vendor_id,
            vendor_name: payload.vendor_name,
            user_info: this.userProfileService.getUserInfoForTracking(),
          }
        }
      });
      this.toastService.fire({
        type: 'success',
        message: result?.statusDescription || 'Success!',
      });

      const venderFilters = this._vendorsResults.getValue();

      const filterVenderListingPayload: GetListPayload = {
        globalSearch: venderFilters?.searchText || '',
        sortColumn: venderFilters?.sorting?.prop || 'last_modified_at',
        sortDirection: venderFilters?.sorting?.dir || 'desc',
        columnFilters: venderFilters?.columnFilters || [],
        pagination:{
          pageIndex: venderFilters?.pagination?.startIndex || 1,
          pageSize: venderFilters?.pagination?.pageSize || 50
        },
      }

      this.getVendorsList(filterVenderListingPayload);
    } catch (err: any) {
      this.logError(err);
      this.uiService.setLoader(false);
    }
  }

  /**
   * Adds a new vendor.
   *
   * - Sends an API POST request to add a new vendor with the provided `vendor_name`.
   * - The user info is included in the request, pulling the logged-in user's email.
   * - Upon successful creation, a success toast notification is triggered.
   * - The vendor list is refreshed by calling `getVendorsList()` after the new vendor is added.
   * - If an error occurs during the add operation, the error is logged, and the loader is stopped.
   * - A loader is displayed during the API request to indicate the process is ongoing.
   *
   * @param {AddVendorPayload} payload - Contains the new vendor data (`vendor_name`).
   */
  async addVendor(payload: AddVendorPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.restApiService.postRequest({
        path: `asher/vendors`,
        body: {
          data: {
            vendor_name: payload.vendor_name,
            user_info: this.userProfileService.getUserInfoForTracking(),
          }
        }
      });

      this.toastService.fire({
        type: 'success',
        message: result?.statusDescription || 'Success!',
      });

      const venderFilters = this._vendorsResults.getValue();

      const filterVenderListingPayload: GetListPayload = {
        globalSearch: venderFilters?.searchText || '',
        sortColumn: venderFilters?.sorting?.prop || 'desc',
        sortDirection: venderFilters?.sorting?.dir || 'last_modified_at',
        columnFilters: venderFilters?.columnFilters || [],
        pagination:{
          pageIndex: venderFilters?.pagination?.startIndex || 1,
          pageSize: venderFilters?.pagination?.pageSize || 50
        },
      }

      this.getVendorsList(filterVenderListingPayload);
      return result;
    } catch (err: any) {
      this.logError(err);
      this.uiService.setLoader(false);
      return [];
    }
  }

  /**
   * Deletes an existing vendor.
   *
   * - Makes an API DELETE request to remove an vendor based on the provided `payload.vendor_id`.
   * - Sends the vendor's `id` and user information (like email) to the backend.
   * - If the deletion is successful, a success message is shown via a toast notification, and the vendor list is refreshed.
   * - If an error occurs during the deletion, it is logged, and the loader state is set accordingly.
   * 
   * @param {DeleteVendorPayload} payload - Contains the `id` of the vendor to be deleted.
   * @returns {Promise<any>} - A promise resolving to the result of the API call (e.g., deletion status or message).
   */
  async deleteVendor(payload: DeleteVendorPayload) {
    try {
      this.uiService.setLoader(true);

      await this.restApiService.deleteRequest({
        path: `asher/vendors/${payload.vendor_id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this.toastService.fire({
        type: 'success',
        message: 'Vendor deleted successfully!',
      });

      const venderFilters = this._vendorsResults.getValue();

      const filterVenderListingPayload: GetListPayload = {
        globalSearch: venderFilters?.searchText || '',
        sortColumn: venderFilters?.sorting?.prop || 'last_modified_at',
        sortDirection: venderFilters?.sorting?.dir || 'desc',
        columnFilters: venderFilters?.columnFilters || [],
        pagination:{
          pageIndex: venderFilters?.pagination?.startIndex || 1,
          pageSize: venderFilters?.pagination?.pageSize || 50
        },
      }
      this.getVendorsList(filterVenderListingPayload);
    } catch (err: any) {
      this.logError(err);
      this.uiService.setLoader(false);
    }
  }

  // Checks if a unique key already exists, always returns true for now.
  async checkUniqueKeyAlreadyExist(uniqueKey: string): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fetches a list of Asher users based on various search, pagination, and sorting parameters.
   *
   * - Constructs the query parameters for the API request, including pagination, sorting, and optional global search.
   * - If column filters are provided, they are converted from camelCase to snake_case before being added to the search parameters.
   * - Sends an API GET request to fetch the user list from the Asher API.
   * - If successful, the `users` response is set to 200 status in the API response tracker.
   * - Loader is displayed while fetching data and hidden once the request is complete or if an error occurs.
   * - In case of an error, the error is logged and no further action is taken.
   *
   * @param {Object} payload - The request payload containing search, pagination, and sorting parameters.
   * @param {Object} payload.pagination - Pagination information including `pageIndex` and `pageSize`.
   * @param {string} payload.sortDirection - The direction to sort the results (`asc` or `desc`).
   * @param {string} payload.sortColumn - The column to sort the results by.
   * @param {string} payload.globalSearch - A global search term to filter results by.
   * @param {Array<ColumnFilter>} payload.columnFilters - Column-specific filters to apply.
   */
  async getApplicationUsers(payload?: any) {
    try {
      this.uiService.setLoader(true);

      //Builds a query string and search parameters object from the given payload.
      const { queryParams } = this.buildQueryString(payload);

      const asherUserLists = await this.restApiService.getRequest({
        path: `asher/users`,
        queryParams
      });

      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(asherUserLists, payload, queryParams);

      this._users.next(formattedResponse);
      this.setApiResponse('users', asherUserLists.statusCode || 200);
    } catch (err: any) {
      this.logError(err);
      this.setApiResponse('users', err.statusCode || 520);
      return;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
 * Fetches the details of a specific user by their email address.
 *
 * - Sends an API request to retrieve user details from the Asher API using the provided email address.
 * - If the user data is found, it is returned. If not, an empty object is returned.
 * - In case of an error, a toast notification is displayed with an error message.
 * - Loader is displayed while fetching the data and hidden once the request completes or an error occurs.
 *
 * @param {string} email - The email address of the user whose details are to be fetched.
 * 
 * @returns {Object} - The user details object or an empty object if no user is found or an error occurs.
 */
  async getUser(email: string) {
    try {
      this.uiService.setLoader(true);
      const user = await this.restApiService.getRequest({
        path: `asher/users/${email}`
      });

      return user?.data || {};
    } catch (error: any) {
      this.toastService.fire({
        type: 'error',
        message: error?.error?.statusDescription || error?.message || 'Something went wrong fetching user details',
      });
      return {};
    } finally {
      this.uiService.setLoader(false);
    }
  }

  // Capitalizes the first letter of each word in the given string.
  capitalizeWords(term: string) {
    return term?.toLowerCase()?.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // Fetches records from a database using pagination, returns all records.
  async tableRecords(dbRequest: any) {
    let results: any[] = [];
    let nextToken = null;
    let localLimit = dbRequest.limit;

    do {
      const { data, nextToken: nt } = (await dbRequest.tableModel.list({
        limit: localLimit,
        nextToken,
        filter: dbRequest.filter,
        selectionSet: dbRequest.selectionSet,
      })) as any;

      nextToken = nt;
      results = results.concat(data || []);
      localLimit = dbRequest.limit - results?.length;
    } while (localLimit > 0 && nextToken);
    return results;
  }

  // Clears the lifecycle details from the service.
  clearLifeCycleDetails() {
    this._lifeCycleDetails.next({});
  }

  // Clears the vendor details from the service.
  clearVendorDetails() {
    this._vendorDetails.next({});
  }

  // Logs the error details to the console and displays a toast error message.
  logError(err: any) {
    const error = err?.error;
    
    const errorMessage = error?.statusDescription || (typeof error === 'string' && error) || error?.message || 'Something went wrong';
      this.toastService.fire({
        type: 'error',
        message: errorMessage
      });

    console.error('API Response Failure===', {
      message: errorMessage,
      transactionId: error?.transactionId || 'N/A'
    });
  }


  //Fetching the listing API's based on the path
  loadRouteData(path: string) {
    switch (path) {
      case 'applications':
        if (this.reloadData('applications')) {
          this.getApplicationList();
        }
        break;
      case 'users':
        if (this.reloadData('users')) {
          this.getApplicationUsers();
        }
        break;
      case 'lifecycles':
        if (this.reloadData('lifecycles')) {
          this.getLifeCyclesList();
        }
        break;
      case 'vendors':
        if (this.reloadData('vendors')) {
          this.getVendorsList();
        }
        break;
      case 'dashboard':
        if (this.reloadData('dashboard')) {
          this.getDashBoardData();
        }
        break;
      case 'configurations':
        if (this.reloadData('configurations')) {
          this.getConfigurations();
        }
        break;
      case 'departments':
        if (this.reloadData('departments')) {
          this.getDepartmentList();
        }
        break;
    }
  }

  /**
   * Builds a query string and search parameters object from the given payload.
   *
   * @param payload - Optional object containing pagination, sorting, and filtering information.
   * @returns An object with:
   *    - queryString: URL-encoded query string to be used in HTTP requests
   *    - searchParams: Raw object of search parameters for reference or debugging
   */
  buildQueryString(payload?: GetListPayload) {
    // Initialize search parameters with defaults
    const queryParams: any = {
      pageIndex: payload?.pagination?.pageIndex ? payload.pagination.pageIndex - 1 : 0,
      pageSize: payload?.pagination?.pageSize || recordsPerPage.defaultSize,
      sortColumn: payload?.sortColumn || 'last_modified_at',
      sortDirection: payload?.sortDirection || 'desc',
    };

    // from 1213 to 1226, these params are optional so, it should be added to queryParams only if these are defined. If not defined, it should not be added in the queryParams object

    // Add global search term if available
    if (payload?.globalSearch) {
      queryParams.globalSearch = payload?.globalSearch;
    }
    // Add column filters if provided
    if (payload?.columnFilters?.length) {
      queryParams.columnFilters = JSON.stringify(payload?.columnFilters);
    }

    // Convert queryParams object to URL query string
    // const queryString = new URLSearchParams(Object.entries(queryParams)).toString();

    // Return both the query string and the raw object
    return { queryParams };
  }

  /**
   * Formats the response data into a structured object containing rows, pagination, search text, sorting, and column filters.
   *
   * @param result - The raw response data to be formatted.
   * @param payload - Optional payload containing pagination, global search, and column filter information.
   * @param queryParams - Optional query parameters containing sorting information.
   * @returns An object containing the formatted response with rows, pagination details, search text, sorting, column filters, and a loaded flag.
   */
  getFormattedResponse(result: any, payload?: GetListPayload, queryParams?: GetListPayload) {
    const formattedResponse = {
      rows:
        result?.data?.map((result: any) => {
          return result;
        }) || [],
      pagination: {
        startIndex: payload?.pagination?.pageIndex || 1,
        pageSize: payload?.pagination?.pageSize || recordsPerPage.defaultSize,
        totalCount: result?.totalCount,
      },
      searchText: payload?.globalSearch || '',
      sorting: { prop: queryParams?.sortColumn, dir: queryParams?.sortDirection },
      columnFilters: payload?.columnFilters || [],
      loaded: true,
      staleRecordsCount: result?.staleRecordsCount || 0,
      terminatedUsersCount: result?.terminatedUsersCount || 0
    }
    return formattedResponse;
  }

  async downloadTableData(payload?: DownloadFilePayload) {
    this.uiService.setLoader(true);
    try{
      const { queryParams } = this.buildQueryString(payload);
      const blob = await this.restApiService.getRequest({
        path: `asher/applications`,
        queryParams: {
          ...queryParams,
          download: true,
          orderedColumns: payload?.orderedColumns || ''
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${payload?.fileName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    catch (e: any) {
      console.error(e);
    }
    finally {
      this.uiService.setLoader(false);
    }
  }

  currentDate() {
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');

    const hours = date.getHours(); // Convert to 12-hour format
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Ensure two digits
    const period = date.getHours() < 12 ? 'AM' : 'PM'; // Determine AM/PM

    return `${formattedDate}-${String(hours).padStart(2, '0')}-${minutes}-${period}`;
  }


  async getApplicationLogs(id?: number, payload?: GetListPayload) {
    try {
      this.uiService.setLoader(true);
      const {queryParams} = this.buildQueryString(payload);
      
      const response = await this.restApiService.getRequest({
        path: `asher/applications_history/timeline/${id}`,
        queryParams: queryParams
      });

      return response || {};
    } catch (error: any) {
      this.toastService.fire({
        type: 'error',
        message: error?.error?.statusDescription || error?.message || 'Something went wrong fetching user details',
      });
      return {};
    } finally {
      this.uiService.setLoader(false);
    }
  }

 async getDashBoardData(payload?: GetListPayload){
  try {
    this.uiService.setLoader(true);
    this._isChartLoading.next(true);
    const { queryParams} = this.buildQueryString(payload);
    const response = await this.restApiService.getRequest({
      path: `asher/dashboards`,
      queryParams: queryParams || {}
    });
    const formattedResponse = this.getFormattedResponse(response, payload, queryParams);
    this._dashboardDetails.next(formattedResponse || [])
    this.setApiResponse('dashboard', 200);
    return response?.data || [];
  } catch (error: any) {
    this.setApiResponse('dashboard', error.statusCode || 520);
    this.toastService.fire({
      type: 'error',
      message: error?.error?.statusDescription || error?.message || 'Something went wrong fetching user details',
    });
    return {};
  } finally {
    this._isChartLoading.next(false);
    this.uiService.setLoader(false);
  }
 }

  async downloadDashBoardTableData(payload?: DownloadFilePayload){
    this.uiService.setLoader(true);
    try{
      const { queryParams } = this.buildQueryString(payload);
      const base64Data = await this.restApiService.getRequest({
        path: `asher/dashboards`,
        queryParams: {
          ...queryParams,
          download: true,
          orderedColumns: payload?.orderedColumns || ''
        },
        responseType: 'text'
      });

      const cleanBase64 = base64Data.replace(/[^A-Za-z0-9+/=]/g, '');
      const binaryString = window.atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${payload?.fileName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    catch(e: any){
      console.error(e);
    }
    finally{
      this.uiService.setLoader(false);
    }
  }

  async getConfigurations(payload?: GetListPayload){
    try {
      this.uiService.setLoader(true);
      const { queryParams } = this.buildQueryString(payload);

      const response = await this.restApiService.getRequest({
        path: `asher/notification_config`,
        queryParams: queryParams
      });
      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(response, payload, queryParams);
      this._configurationsResults.next(formattedResponse || [])
      this.setApiResponse('configurations', 200);
      return [];
    } catch (error: any) {
      this.setApiResponse('configurations', error.statusCode || 520);
      this.toastService.fire({
        type: 'error',
        message: error?.error?.statusDescription || error?.message || 'Something went wrong fetching user details',
      });
      return {};
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getConfigurationsDetails(payload: ConfigurationsDetailsPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.restApiService.getRequest({
        path: `asher/notification_config/${payload.id}`
      });
      const apiConfigurationDetails = result?.data || null;

      if (!apiConfigurationDetails) {
        throw new Error(messages.error.asher.notFound);
      }
      this._configurationsDetails.next(apiConfigurationDetails);
      return apiConfigurationDetails;
    } catch (err: any) {
      this.logError(err);
      return;
    }
    finally {
      this.uiService.setLoader(false);
    }
  }

  async updateConfigurations(payload: UpdateConfigurationsPayload) {
    try {
      this.uiService.setLoader(true);
      const result  = await this.restApiService.putRequest({
        path: `asher/notification_config`,
        body: {
          data: {
            id: payload.id,
            notification_event: payload.notification_event,
            initial_trigger_days: payload.initial_trigger_days,
            repeat_frequency_days: payload.repeat_frequency_days,
            threshold: payload.threshold,
            email_to: payload.email_to,
            email_cc: payload.email_cc,
            email_bcc: payload.email_bcc,
            admin_email: payload.admin_email,
            email_subject: payload.email_subject,
            email_body: payload.email_body,
            email_reminder_subject: payload.email_reminder_subject,
            email_reminder_body: payload.email_reminder_body,
            attribute_1: payload.attribute_1,
            attribute_2: payload.attribute_2,
            attribute_3: payload.attribute_3,
            attribute_4: payload.attribute_4,
            attribute_5: payload.attribute_5,
            record_status: payload.record_status,
            user_info: this.userProfileService.getUserInfoForTracking(),
          }
        }
      });

      this.toastService.fire({
        type: 'success',
        message: result?.statusDescription || 'Success!',
      });
      
      const configurationsFilters =  this._configurationsResults.getValue();
      
      const filterListingPayload: GetListPayload = {
        globalSearch: configurationsFilters?.searchText || '',
        sortColumn: configurationsFilters?.sorting?.prop || 'last_modified_at',
        sortDirection: configurationsFilters?.sorting?.dir || 'desc',
        columnFilters: configurationsFilters?.columnFilters || [],
        pagination:{
          pageIndex: configurationsFilters?.pagination?.startIndex || 1,
          pageSize: configurationsFilters?.pagination?.pageSize || 50
        },
      }
      this.getConfigurations(filterListingPayload);
      result.id = payload.id;
      return result;
    } catch (err: any) {
      this.logError(err);
      this.uiService.setLoader(false);
      return {};
    } finally {
      this.uiService.setLoader(false);
    }
  }

}