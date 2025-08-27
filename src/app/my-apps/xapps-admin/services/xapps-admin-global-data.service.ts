import { Injectable } from '@angular/core';
// import { DefaultService } from '../swagger/api/services';
import { BehaviorSubject } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';
import { GlobalDataService as GS } from 'src/app/common/services/global-data.service';
import { ToastService } from 'src/app/common/services/toast.service';
import { UserProfileService } from 'src/app/common/services/user-profile.service';
import { RestApiService } from '@app/common/services/rest-api.service';
import { GetListPayload } from '../interfaces/global.interface';
import { recordsPerPage } from '../constants/global.constant';

interface RoleListRequestPayload {
  application?: string;
}

interface AddUserPayload {
  firstName: string;
  lastName: string;
  email: string;
}

interface UserDetailsPayload {
  id: string;
}
interface ApplicationDetailsPayload {
  id: string;
}

interface RoleDetailsPayload {
  id: string;
}
interface appAccessRequestDetailsPayload {
  id: string;
}
interface ModuleDetailsPayload {
  id: string;
}

interface SubmoduleDetailsPayload {
  id: string;
}

interface PermissionDetailsPayload {
  id: string;
}

interface UpdateUserPayload extends AddUserPayload {
  id: string;
  isActive: boolean;
}

interface UpdateUserStatusPayload {
  id: string;
  isActive: boolean;
}
interface AccessRequestPayload {
  id: string;
  isCompleted: boolean;
  reviewedBy: string;
  commentBy?: string;
  message?: string;
}

interface MsgInfoPayload {
  id: string;
  commentBy: string;
  message: string;
  inReview?: boolean;
}

interface DeleteRolePayload {
  id: string;
}

interface DeleteModulePayload {
  id: string;
}

interface DeleteSubmodulePayload {
  id: string;
}

interface DeletePermissionPayload {
  id: string;
}

interface DeleteApplication {
  id: string;
}

type ApplicationStatus = 'Development_Initiated' | 'Launched' | 'Coming_Soon';

interface AddApplication {
  applicationName: string;
  status: ApplicationStatus;
  logo: string;
  sortOrder: number;
  userId: string;
  description?: string; 
}

interface EditApplication {
  id: string;
  applicationName: string;
  status: ApplicationStatus;
  logo: string;
  sortOrder: number;
  userId: string;
  isActive: boolean;
  description?: string;
}

interface AddRolePayload {
  roleName?: string;
  appId?: string;
  userId?: string;
  description?: string;
}
interface AddModulePayload {
  applicationId: string;
  moduleName: string;
  userId: string;
  description: string;
}

interface AddSubmodulePayload {
  moduleId: string;
  subModuleName: string;
  userId: string;
  description: string;
}

interface AddPermissionPayload {
  moduleId: string;
  permissionName: string;
  userId: string
  description: string,
  submoduleId: string
}

interface UpdateRolePayload extends AddRolePayload {
  id: string;
  isActive: boolean;
  application?:any;
}
interface UpdateModulePayload extends AddModulePayload {
  id: string;
  isActive: boolean;
}

interface UpdateSubmodulePayload extends AddSubmodulePayload {
  id: string;
  isActive: boolean;
}
interface UpdatePermissionPayload extends AddPermissionPayload {
  id: string;
  isActive: boolean;
}

interface Role {
  id: string;
}

interface ManageRolePayload {
  userId: string;
  assignedRoles: Role[];
}

interface Permission {
  id: string;
}

interface AssignedUser extends Permission {}

interface ManagePermissionPayload {
  roleId: string;
  assignedPermissions: Permission[];
}

interface ManageRoleUsersPayload {
  roleId: string;
  assignedUsers: AssignedUser[];
}

interface ManageUserPermissionPayload {
  userId: string;
  assignedSpecialPermissions: Permission[];
}

interface PermissionsPayload {
  roleId: string;
}

interface UsersPayload extends PermissionsPayload {}

interface UserPermissionsPayload {
  userId: string;
}

interface GetModulesPayload {
  applicationId: string;
}

interface GetSubmodulesPayload {
  moduleId: string;
}

interface GetRolesByApplicationPayload {
  userId: string;
}

interface appAccessRequestCommentsPayload {
  id: string;
}

interface ApiStatus {
  apiCode: string;
  statusCode: number;
}

export interface Module {
  id: number;
  app_id: number;
  app_name: string;
  app_slug: string;
  module_name: string;
  description?: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface RoleList {
  id: number;
  role_name: string;
  description?: string;
  slug: string;
  app_id: number;
  app_name: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  updated_at: string;
  updated_by: number;
}

export interface Application {
  id: number;
  application_name: string;
  description?: string;
  slug: string;
  logo: string;
  status: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface SubModule {
  id: number;
  app_id: number;
  app_name: string;
  app_slug: string;
  module_id: number;
  module_name: string;
  module_slug: string;
  sub_module_name: string;
  description?: string;
  slug: string;
  is_active: boolean;
  is_deleted: boolean;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface PermissionList {
  id: number;
  module_id: number;
  module_name: string;
  sub_module_id?: number | null;
  sub_module_name?: string | null;
  app_id: number;
  application_name: string;
  permission_name: string;
  description?: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  updated_at: string;
  updated_by: number;
}



@Injectable({
  providedIn: 'root',
})
export class XAppsAdminGlobalDataService {
  private apiStatuses: Array<ApiStatus> = [];

  // Observables to share data between components
  private _applicationResults = new BehaviorSubject<any>([]);
  applicationResults$ = this._applicationResults.asObservable();

  private _usersResults = new BehaviorSubject<any>([]);
  usersResults$ = this._usersResults.asObservable();

  private _userDetails = new BehaviorSubject<any>({});
  userDetails$ = this._userDetails.asObservable();

  private _roleDetails = new BehaviorSubject<any>({});
  roleDetails$ = this._roleDetails.asObservable();

  private _accessRequestDetails = new BehaviorSubject<any>([]);
  _accessRequestDetails$ = this._accessRequestDetails.asObservable();

  private _moduleDetails = new BehaviorSubject<any>([]);
  moduleDetails$ = this._moduleDetails.asObservable();

  private _submoduleDetails = new BehaviorSubject<any>([]);
  submoduleDetails$ = this._submoduleDetails.asObservable();

  private _permissionDetails = new BehaviorSubject<any>([]);
  permissionDetails$ = this._permissionDetails.asObservable();

  private _applicationDetails = new BehaviorSubject<any>([]);
  applicationDetails$ = this._applicationDetails.asObservable();

  private _modulesResults = new BehaviorSubject<any>([]);
  modulesResults$ = this._modulesResults.asObservable();

  private _submoduleResults = new BehaviorSubject<any>([]);
  submoduleResults$ = this._submoduleResults.asObservable();

  private _permissionsResults = new BehaviorSubject<any>([]);
  permissionsResults$ = this._permissionsResults.asObservable();

  private _roleUserResults = new BehaviorSubject<any>([]);
  roleUserResults$ = this._roleUserResults.asObservable();

  private _rolesResultsByApplication = new BehaviorSubject<any>([]);
  rolesResultsByApplication$ = this._rolesResultsByApplication.asObservable();

  private _getModulesResults = new BehaviorSubject<any>([]);
  getModulesResults$ = this._getModulesResults.asObservable();

  private _getSubmodulesResults = new BehaviorSubject<any>([]);
  getSubmodulesResults$ = this._getSubmodulesResults.asObservable();

  private _accessRequestComments = new BehaviorSubject<any>([]);
  accessRequestComments$ = this._accessRequestComments.asObservable();

  private _getAppAccessResults = new BehaviorSubject<any>([]);
  getAppAccessResults$ = this._getAppAccessResults.asObservable();

  private _getPermissionResults = new BehaviorSubject<any>([]);
  getPermissionResults$ = this._getPermissionResults.asObservable();

  _rolesResults = new BehaviorSubject<any>({
    rows: [],
    pagination: {
      startIndex: 0,
      pageSize: recordsPerPage.defaultSize,
      totalCount: 0,
    },
    searchText: '',
    sorting: { prop: 'updated_at', dir: 'desc' },
    columnFilters: [],
    loaded: false
  });
  rolesResults$ = this._rolesResults.asObservable();

  private _application = new BehaviorSubject<string>('');
  application$ = this._application.asObservable();



  private _moduleLookup = new BehaviorSubject<any>([]);
  moduleLookup$ = this._moduleLookup.asObservable();

  private _submoduleLookup = new BehaviorSubject<any>([]);
  submoduleLookup$ = this._submoduleLookup.asObservable();

  private _applicationLookup = new BehaviorSubject<any>([]);
  applicationLookup$ = this._applicationLookup.asObservable();


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

  constructor(
    private uiService: UIService,
    private toastService: ToastService,
    private gs: GS,
    private userProfileService: UserProfileService,
    private restApiService: RestApiService
  ) {}

  reloadData(apiCode: string) {
    const thisApiStatus = this.apiStatuses.find(
      (apiStatus: ApiStatus) =>
        apiStatus.apiCode === apiCode && apiStatus.statusCode,
    );
    return !thisApiStatus?.apiCode ? true : false;
  }

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
   * Fetch all applications from the database.
   */
  //  try {
  //   this.uiService.setLoader(true);

  //   //Builds a query string and search parameters object from the given payload.
  //   const { queryParams } = this.buildQueryString(payload);

  //   const asherUserLists = await this.restApiService.getRequest({
  //     path: `xapps-admin/users`,
  //     queryParams
  //   });

  //   // Processes the provided data and returns a formatted response.
  //   const formattedResponse = this.getFormattedResponse(asherUserLists, payload, queryParams);

  //   this._users.next(formattedResponse);
  //   this.setApiResponse('users', asherUserLists.statusCode || 200);
  // } catch (err: any) {
  //   this.setApiResponse('users', err.statusCode || 520);
  //   return;
  // } finally {
  //   this.uiService.setLoader(false);
  // }
  async getApplications(payload?: GetListPayload) {
    try {
      this.uiService.setLoader(true);

      const { queryParams } = this.buildQueryString(payload);

      const applicationLists = await this.restApiService.getRequest({
        path: `xapps-admin/apps`,
        queryParams,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(applicationLists, payload, queryParams);

      this._applicationResults.next(formattedResponse);
      this.setApiResponse('applications', applicationLists?.statusCode || 200)
    } catch (err: any) {
      this.logError(err);
      this.setApiResponse('applications', 520);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Deletes an existing applications.
   *
   * - Makes an API DELETE request to remove an applications based on the provided `payload.id`.
   * - Sends the applications's `id` and user information (like email) to the backend.
   * - If the deletion is successful, a success message is shown via a toast notification, and the applications list is refreshed.
   * - If an error occurs during the deletion, it is logged, and the loader state is set accordingly.
   * 
   * @param {DeleteApplication} payload - Contains the `id` of the applications to be deleted.
   * @returns {Promise<any>} - A promise resolving to the result of the API call (e.g., deletion status or message).
   */
  async deleteApplication(payload: DeleteApplication) {
    try {
      this.uiService.setLoader(true);
      await this.restApiService.deleteRequest({
        path: `xapps-admin/apps/${payload.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this.toastService.fire({
        type: 'success',
        message: 'Application deleted successfully!',
      });
      const filterPayload = this.buildFilterListingPayload(this._application.getValue());
      this.getApplications(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Get all the role .
   */
  async getRoles(payload?: GetListPayload) {
    try {
      this.uiService.setLoader(true);

      //Builds a query string and search parameters object from the given payload.
      const application = this._application.getValue() || '';
      if(application){
        if(!payload){
          payload = {};
        }
        payload.application = application
      }
      const { queryParams } = this.buildQueryString(payload);

      const roleLists = await this.restApiService.getRequest({
        path: `xapps-admin/roles`,
        queryParams,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        },
      });

      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(roleLists, payload, queryParams);
      this._rolesResults.next(formattedResponse);
      this.setApiResponse('roles', roleLists.statusCode || 200);
    } catch (err: any) {
      this.setApiResponse('roles', err.statusCode || 520);
      return;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Deletes an existing roles.
   *
   * - Makes an API DELETE request to remove an roles based on the provided `payload.id`.
   * - Sends the roles's `id` and user information (like email) to the backend.
   * - If the deletion is successful, a success message is shown via a toast notification, and the roles list is refreshed.
   * - If an error occurs during the deletion, it is logged, and the loader state is set accordingly.
   * 
   * @param {DeleteRolePayload} payload - Contains the `id` of the roles to be deleted.
   * @returns {Promise<any>} - A promise resolving to the result of the API call (e.g., deletion status or message).
   */
  async deleteRole(payload: DeleteRolePayload) {
    try {
      this.uiService.setLoader(true);
      await this.restApiService.deleteRequest({
        path: `xapps-admin/roles/${payload.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this.toastService.fire({
        type: 'success',
        message: 'Role deleted successfully!',
      });
      const filterPayload = this.buildFilterListingPayload(this._rolesResults.getValue())
      this.getRoles(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getModules(payload?: GetListPayload) {
    try {
      this.uiService.setLoader(true);

      //Builds a query string and search parameters object from the given payload.
      const { queryParams } = this.buildQueryString(payload);

      const moduleLists = await this.restApiService.getRequest({
        path: `xapps-admin/modules`,
        queryParams,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(moduleLists, payload, queryParams);
      this._modulesResults.next(formattedResponse);
      this.setApiResponse('modules', moduleLists.statusCode || 200);
    } catch (err: any) {
      this.logError(err);
      this.setApiResponse('modules', err.statusCode || 520);
      return;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Deletes an existing modules.
   *
   * - Makes an API DELETE request to remove an modules based on the provided `payload.id`.
   * - Sends the modules's `id` and user information (like email) to the backend.
   * - If the deletion is successful, a success message is shown via a toast notification, and the modules list is refreshed.
   * - If an error occurs during the deletion, it is logged, and the loader state is set accordingly.
   * 
   * @param {DeleteModulePayload} payload - Contains the `id` of the modules to be deleted.
   * @returns {Promise<any>} - A promise resolving to the result of the API call (e.g., deletion status or message).
   */
  async deleteModule(payload: DeleteModulePayload) {
    try {
      this.uiService.setLoader(true);
      await this.restApiService.deleteRequest({
        path: `xapps-admin/modules/${payload.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this.toastService.fire({
        type: 'success',
        message: 'Module deleted successfully!',
      });
      const filterPayload = this.buildFilterListingPayload(this._modulesResults.getValue());
      this.getModules(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getSubmodules(payload?: GetListPayload) {
    try {
      this.uiService.setLoader(true);

      //Builds a query string and search parameters object from the given payload.
      const { queryParams } = this.buildQueryString(payload);

      const submoduleLists = await this.restApiService.getRequest({
        path: `xapps-admin/submodules`,
        queryParams,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(submoduleLists, payload, queryParams);

      this._submoduleResults.next(formattedResponse);
      this.setApiResponse('submodules', submoduleLists?.statusCode || 200);
    } catch (err: any) {
      this.setApiResponse('submodules', err.statusCode || 520);
      this.logError(err);
      return;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Deletes an existing submodules.
   *
   * - Makes an API DELETE request to remove an submodules based on the provided `payload.id`.
   * - Sends the submodules's `id` and user information (like email) to the backend.
   * - If the deletion is successful, a success message is shown via a toast notification, and the submodules list is refreshed.
   * - If an error occurs during the deletion, it is logged, and the loader state is set accordingly.
   * 
   * @param {DeleteSubmodulePayload} payload - Contains the `id` of the submodules to be deleted.
   * @returns {Promise<any>} - A promise resolving to the result of the API call (e.g., deletion status or message).
   */
  async deleteSubModule(payload: DeleteSubmodulePayload) {
    try {
      this.uiService.setLoader(true);
      await this.restApiService.deleteRequest({
        path: `xapps-admin/submodules/${payload.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this.toastService.fire({
        type: 'success',
        message: 'Submodule deleted successfully!',
      });
      const filterPayload = this.buildFilterListingPayload(this._submoduleResults.getValue());
      this.getSubmodules(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }
  /**
   * Fetches all permissions for a specific module and role.
   * @param payload - The module and role IDs to fetch permissions for.
   */

  async getPermissions(payload?: GetListPayload) {
    try {
      this.uiService.setLoader(true);

      //Builds a query string and search parameters object from the given payload.
      const { queryParams } = this.buildQueryString(payload);

      const permissionLists = await this.restApiService.getRequest({
        path: `xapps-admin/permissions`,
        queryParams,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(permissionLists, payload, queryParams);
      this._permissionsResults.next(formattedResponse);
      this.setApiResponse('permissions', permissionLists?.statusCode || 200);
    } catch (err: any) {
      this.setApiResponse('permissions', err.statusCode || 520);
      this.logError(err);
      return;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Deletes an existing permission.
   *
   * - Makes an API DELETE request to remove an permission based on the provided `payload.id`.
   * - Sends the permission's `id` and user information (like email) to the backend.
   * - If the deletion is successful, a success message is shown via a toast notification, and the permission list is refreshed.
   * - If an error occurs during the deletion, it is logged, and the loader state is set accordingly.
   * 
   * @param {DeletePermissionPayload} payload - Contains the `id` of the permission to be deleted.
   * @returns {Promise<any>} - A promise resolving to the result of the API call (e.g., deletion status or message).
   */
  async deletePermission(payload: DeletePermissionPayload) {
    try {
      this.uiService.setLoader(true);
      await this.restApiService.deleteRequest({
        path: `xapps-admin/permissions/${payload.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this.toastService.fire({
        type: 'success',
        message: 'Permission deleted successfully!',
      });
      const filterPayload = this.buildFilterListingPayload(this._permissionsResults.getValue());
      this.getPermissions(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }


  buildQueryString(payload?: GetListPayload) {
    // Initialize search parameters with defaults
    const queryParams: any = {
      pageIndex: payload?.pagination?.pageIndex ? payload.pagination.pageIndex - 1 : 0,
      pageSize: payload?.pagination?.pageSize || 50,
      sortColumn: payload?.sortColumn || 'updated_at',
      sortDirection: payload?.sortDirection || 'desc',
    };

    // from 1213 to 1226, these params are optional so, it should be added to queryParams only if these are defined. If not defined, it should not be added in the queryParams object

    // Define optional properties to map into queryParams if they're present
    const optionalMappings: [keyof GetListPayload, string][] = [
      ['globalSearch', 'globalSearch'],
      ['columnFilters', 'columnFilters'],
      ['applicationId', 'appId'],
      ['moduleId', 'moduleId'],
      ['submoduleId', 'submoduleId'],
      ['skipLimit', 'skipLimit'],
      ['application', 'application'],
    ];

    for (const [key, paramKey] of optionalMappings) {
      const value = payload?.[key];
      if (value !== undefined && value !== null) {
        queryParams[paramKey] =
          key === 'columnFilters' ? JSON.stringify(value) : value;
      }
    }

    // Convert queryParams object to URL query string
    // const queryString = new URLSearchParams(Object.entries(queryParams)).toString();

    // Return both the query string and the raw object
    return { queryParams };
  }

  getFormattedResponse(result: any, payload?: GetListPayload, queryParams?: GetListPayload) {
    const formattedResponse = {
      rows:
        result?.data?.map((result: any) => {
          return result;
        }) || [],
      pagination: {
        startIndex: payload?.pagination?.pageIndex || 1,
        pageSize: payload?.pagination?.pageSize || 50,
        totalCount: result?.totalCount,
      },
      searchText: payload?.globalSearch || '',
      sorting: { prop: queryParams?.sortColumn, dir: queryParams?.sortDirection },
      columnFilters: payload?.columnFilters || [],
      loaded: true,
    }
    return formattedResponse;
  }
  
  async getUsers(payload?: GetListPayload) {
    try {
      this.uiService.setLoader(true);

      //Builds a query string and search parameters object from the given payload.
      const { queryParams } = this.buildQueryString(payload);

      const asherUserLists = await this.restApiService.getRequest({
        path: `xapps-admin/users`,
        queryParams,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      // Processes the provided data and returns a formatted response.
      const formattedResponse = this.getFormattedResponse(asherUserLists, payload, queryParams);

      this._users.next(formattedResponse);
      this.setApiResponse('users', asherUserLists.statusCode || 200);
    } catch (err: any) {
      this.setApiResponse('users', err.statusCode || 520);
      this.logError(err);
      return;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Fetches all roles for a specific application and user.
   * Uses REST API to retrieve roles and user's assigned roles.
   * @param payload - The application ID and user ID to fetch roles for.
   */
  async getRolesByWithAssigned(payload: GetRolesByApplicationPayload) {
    try {
      const response = await this.restApiService.getRequest({
        path: `xapps-admin/users/${payload.userId}/assigned-roles`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this._rolesResultsByApplication.next(response.data);
      return response.data;
    } catch (err: any) {
      this.logError(err);
      return [];
    }
  }

  /**
   * Manages roles assigned to a user for a specific application, including updating and assigning roles.
   * @param payload - Details to manage role
   */
  async manageRoles(payload: ManageRolePayload) {
    try {
      this.uiService.setLoader(true);

      const response = await this.restApiService.putRequest({
        path: `xapps-admin/users/${payload.userId}/manage-roles`,
        body: {
          userId: parseInt(payload?.userId),
          assignedRoles: payload.assignedRoles
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this.notifySuccessMessage(response);
    } catch (err: any) {
       this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Add a new User.
   * @param payload - Details of the user to add.
   */

  async addUser(payload: AddUserPayload) {
    try {
      this.uiService.setLoader(true);

      const response = await this.restApiService.postRequest({
        path: `xapps-admin/users`,
        body: {
          firstName: payload?.firstName,
          lastName: payload?.lastName,
          email: payload?.email,
          createdByUserId: this.userProfileService.getUserInfoForTracking().id
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._users.getValue());
      this.getUsers(filterPayload);
    } catch (err: any) {
      this.logError(err);
      throw err;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * update the user .
   * @param payload - Details of the user to update.
   */

  async updateUser(payload: UpdateUserPayload) {
    try {
      this.uiService.setLoader(true);

      const response  = await this.restApiService.putRequest({
        path: `xapps-admin/users`,
        body: {
          firstName: payload?.firstName,
          lastName: payload?.lastName,
          email: payload?.email,
          isActive: payload.isActive,
          updatedByUserId: this.userProfileService.getUserInfoForTracking().id
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._users.getValue());
      this.getUsers(filterPayload);
    } catch (err: any) {
      this.logError(err);
      throw err;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Fetches details of a specific user by ID.
   * @param payload - The ID of the user to fetch.
   */
  async getUserDetails(payload: UserDetailsPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.restApiService.getRequest({
        path: `xapps-admin/users/${payload?.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      const apiUserDetails = result?.data || null;
      this._userDetails.next(apiUserDetails);
      return apiUserDetails;
    } catch (err: any) {
      this.logError(err);
      return [];
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Add a new User.
   * @param payload - Details of the user to add.
   */

   async addRole(payload: AddRolePayload) {
    try {
      this.uiService.setLoader(true);

      const response  = await this.restApiService.postRequest({
        path: `xapps-admin/roles`,
        headers: {
            'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        },
        body: {
          roleName: payload?.roleName,
          slug: payload?.roleName?.trim()?.toLowerCase().replace(/\s+/g, '_'),
          appId: payload?.appId,
          description: payload?.description,
          userId: this.userProfileService.getUserInfoForTracking().id,
        }
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._rolesResults.getValue())
      this.getRoles(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Manages permissions assigned to a role for a specific module, including updating and assigning permissions.
   * @param payload - Details to manage Permissions
   */

  async managePermissions(payload: ManagePermissionPayload) {
    try {
      this.uiService.setLoader(true);
      const response = await this.restApiService.putRequest({
        path: `xapps-admin/roles/${payload.roleId}/manage-permissions`,
        body: {
          roleId: payload?.roleId,
          assignedPermissions: payload.assignedPermissions
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this.notifySuccessMessage(response);
    } catch (err: any) {
      this.logError(err);
      } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * update the user .
   * @param payload - Details of the user to update.
   */

  async updateRole(payload: UpdateRolePayload) {
    try {
      this.uiService.setLoader(true);

      const response  = await this.restApiService.putRequest({
        path: `xapps-admin/roles`,
        body: {
          id: payload?.id,
          roleName: payload?.roleName,
          appId: payload?.appId,
          description: payload?.description,
          isActive: payload?.isActive,
          userId: this.userProfileService.getUserInfoForTracking().id,
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        },
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._rolesResults.getValue())
      this.getRoles(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Fetches details of a specific user by ID.
   * @param payload - The ID of the user to fetch.
   */
  async getRoleDetails(payload: RoleDetailsPayload) {
    try {
      const result = await this.restApiService.getRequest({
        path: `xapps-admin/roles/${payload?.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      const apiRoleDetails = result?.data || null;
      this._roleDetails.next(apiRoleDetails);
      return apiRoleDetails;
    } catch (err: any) {
      this.logError(err);
      return [];
    }
  }

  /**
   * Add a new User.
   * @param payload - Details of the user to add.
   */

   async addApplication(payload: AddApplication) {
    try {
      this.uiService.setLoader(true);

      const response  = await this.restApiService.postRequest({
        path: `xapps-admin/apps`,
        body: {
          applicationName: payload?.applicationName,
          status: payload?.status,
          logo: payload?.logo,
          sortOrder: payload?.sortOrder,
          slug: payload.applicationName?.trim()?.toLowerCase().replace(/\s+/g, '_'),
          description: payload?.description,
          userId: this.userProfileService.getUserInfoForTracking().id
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._application.getValue());
      this.getApplications(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * update the user .
   * @param payload - Details of the user to update.
   */

  async updateApplication(payload: EditApplication) {
    try {
      this.uiService.setLoader(true);

      const response  = await this.restApiService.putRequest({
        path: `xapps-admin/apps`,
        body: {
          id: payload?.id,
          applicationName: payload?.applicationName,
          status: payload?.status,
          logo: payload?.logo,
          sortOrder: payload?.sortOrder,
          description: payload?.description,
          isActive: payload?.isActive,
          userId: this.userProfileService.getUserInfoForTracking().id
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._application.getValue());
      this.getApplications(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Fetches details of a specific user by ID.
   * @param payload - The ID of the user to fetch.
   */
  async getApplicationDetails(payload: ApplicationDetailsPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.restApiService.getRequest({
        path: `xapps-admin/apps/${payload?.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      const apiApplicationDetails = result?.data || null;
      this._applicationDetails.next(apiApplicationDetails);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Add a new User.
   * @param payload - Details of the user to add.
   */

   async addModule(payload: AddModulePayload) {
    try {
      this.uiService.setLoader(true);

      const response  = await this.restApiService.postRequest({
        path: `xapps-admin/modules`,
        body: {
          applicationId: payload?.applicationId,
          moduleName: payload?.moduleName,
          slug: payload.moduleName?.trim()?.toLowerCase().replace(/\s+/g, '_'),
          description: payload?.description,
          userId: this.userProfileService.getUserInfoForTracking().id
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._modulesResults.getValue());
      this.getModules(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * update the user .
   * @param payload - Details of the user to update.
   */

  async updateModule(payload: UpdateModulePayload) {
    try {
      this.uiService.setLoader(true);

      const response  = await this.restApiService.putRequest({
        path: `xapps-admin/modules`,
        body: {
          id: payload?.id,
          applicationId: payload?.applicationId,
          moduleName: payload?.moduleName,
          description: payload?.description || '',
          isActive: payload?.isActive,
          userId: this.userProfileService.getUserInfoForTracking().id
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._modulesResults.getValue());
      this.getModules(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Fetches details of a specific user by ID.
   * @param payload - The ID of the user to fetch.
   */
  async getModuleDetails(payload: ModuleDetailsPayload) {
    try {
      this.uiService.setLoader(true);

      const result = await this.restApiService.getRequest({
        path: `xapps-admin/modules/${payload?.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      const apiModuleDetails = result?.data || null;
      this._moduleDetails.next(apiModuleDetails);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Add a new User.
   * @param payload - Details of the user to add.
   */

   async addSubmodule(payload: AddSubmodulePayload) {
    try {
      this.uiService.setLoader(true);

      const response  = await this.restApiService.postRequest({
        path: `xapps-admin/submodules`,
        body: {
          moduleId: payload?.moduleId,
          subModuleName: payload?.subModuleName,
          slug: payload?.subModuleName?.trim()?.toLowerCase().replace(/\s+/g, '_'),
          description: payload?.description,
          userId: this.userProfileService.getUserInfoForTracking().id,
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._submoduleResults.getValue());
      this.getSubmodules(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * update the user .
   * @param payload - Details of the user to update.
   */

  async updateSubmodule(payload: UpdateSubmodulePayload) {
    try {
      this.uiService.setLoader(true);

      const response  = await this.restApiService.putRequest({
        path: `xapps-admin/submodules`,
        body: {
          id: payload?.id,
          moduleId: payload?.moduleId,
          subModuleName: payload?.subModuleName,
          description: payload?.description,
          isActive: payload?.isActive,
          userId: this.userProfileService.getUserInfoForTracking().id,
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._submoduleResults.getValue());
      this.getSubmodules(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Fetches details of a specific user by ID.
   * @param payload - The ID of the user to fetch.
   */
  async getSubmoduleDetails(payload: SubmoduleDetailsPayload) {
    try {
      this.uiService.setLoader(true);

      const result = await this.restApiService.getRequest({
        path: `xapps-admin/submodules/${payload?.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      const apiSubmoduleDetails = result?.data || null;
      this._submoduleDetails.next(apiSubmoduleDetails);
      return apiSubmoduleDetails;
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Add a new User.
   * @param payload - Details of the user to add.
   */

   async addPermisssion(payload: AddPermissionPayload) {
    try {
      this.uiService.setLoader(true);

      const response = await this.restApiService.postRequest({
        path: `xapps-admin/permissions`,
        body: {
          moduleId: payload?.moduleId,
          permissionName: payload?.permissionName,
          slug: payload?.permissionName?.trim()?.toLowerCase().replace(/\s+/g, '_'),
          submoduleId: payload?.submoduleId,
          description: payload?.description,
          userId: this.userProfileService.getUserInfoForTracking().id,
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._permissionsResults.getValue());
      this.getPermissions(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * update the user .
   * @param payload - Details of the user to update.
   */

  async updatePermission(payload: UpdatePermissionPayload) {
    try {
      this.uiService.setLoader(true);

      const response  = await this.restApiService.putRequest({
        path: `xapps-admin/permissions`,
        body: {
          id: payload?.id,
          moduleId: payload?.moduleId,
          permissionName: payload?.permissionName,
          submoduleId: payload.submoduleId,
          description: payload?.description,
          isActive: payload?.isActive,
          userId: this.userProfileService.getUserInfoForTracking().id,
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this.notifySuccessMessage(response);
      const filterPayload = this.buildFilterListingPayload(this._permissionsResults.getValue());
      this.getPermissions(filterPayload);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  /**
   * Fetches details of a specific user by ID.
   * @param payload - The ID of the user to fetch.
   */
  async getPermissionDetails(payload: PermissionDetailsPayload) {
    try {
      const result = await this.restApiService.getRequest({
        path: `xapps-admin/permissions/${payload?.id}`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      return result?.data || null;
    } catch (err: any) {
      this.logError(err);
    }
  }

  async getUsersByRoleId(payload: UsersPayload) {
    try {
      const response = await this.restApiService.getRequest({
        path: `xapps-admin/roles/${payload?.roleId}/assigned-users`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this._roleUserResults.next(response.data);
      return response.data;
    } catch (err: any) {
      this.logError(err);
      return [];
    }
  }

  async manageRoleUsers(payload: ManageRoleUsersPayload) {
    try {
      this.uiService.setLoader(true);
      const response = await this.restApiService.putRequest({
        path: `xapps-admin/roles/${payload?.roleId}/manage-users`,
        body: {
          roleId: parseInt(payload?.roleId),
          assignedUsers: payload.assignedUsers
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this.notifySuccessMessage(response);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getPermissionsByUserId(payload: UserPermissionsPayload) {
    try {
      const response = await this.restApiService.getRequest({
        path: `xapps-admin/users/${payload?.userId}/assigned-special-permissions`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this._permissionsResults.next(response.data);
      return response.data;
    } catch (err: any) {
      this.logError(err);
      return [];
    }
  }

  /**
   * Fetches all permissions and marks which ones are assigned to a specific role.
   * @param payload - Contains roleId to fetch assigned permissions.
   */
  async getPermissionsByRoleId(payload: PermissionsPayload) {
    try {
      const response = await this.restApiService.getRequest({
        path: `xapps-admin/roles/${payload?.roleId}/assigned-permissions`,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this._permissionsResults.next(response.data);
      return response.data;
    } catch (err: any) {
      this.logError(err);
      return [];
    }
  }

  async manageUserPermissions(payload: ManageUserPermissionPayload) {
    try {
      this.uiService.setLoader(true);
      const response = await this.restApiService.putRequest({
        path: `xapps-admin/users/${payload?.userId}/manage-special-permissions`,
        body: {
          userId: parseInt(payload?.userId),
          assignedSpecialPermissions: payload?.assignedSpecialPermissions
        },
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this.notifySuccessMessage(response);
    } catch (err: any) {
      this.logError(err);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  emptizePermissions() {
    this._permissionsResults.next([]);
  }

  emptizeRoleDetails() {
    this._roleDetails.next('');
  }

  emptizeRoleResults() {
    this._rolesResultsByApplication.next([]);
  }

  emptizeUserDetails() {
    this._userDetails.next('');
  }

  emptizeApplicationModules() {
    this._modulesResults.next([]);
  }

  emptizesubmodules() {
    this._submoduleResults.next([]);
  }

  setApplication(application: string){
    this._application.next(application);
  }

  // Logs the error details to the console and displays a toast error message.
  logError(err: any) {
    const error = JSON.parse(err?.response.body);
    
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

  async getApplicationLookup() {
    try {

      if(this.reloadData('application-lookup')){
        const payload = {
          sortColumn: 'application_name',
          sortDirection: 'asc',
          skipLimit: true
        }
  
        const { queryParams } = this.buildQueryString(payload);
  
        const applicationsList = await this.restApiService.getRequest({
          path: `xapps-admin/apps`,
          queryParams,
          headers: {
            'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
          }
        });
        this._applicationLookup.next(applicationsList?.data || [])
        this.setApiResponse('application-lookup', 200);
        return applicationsList?.data;
      }
      
      return this._applicationLookup?.getValue() || []
    } catch (err: any) {
      this.logError(err);
      return [];
    }
  }

  async getModuleLookup(applicationId?: number) {
    this.uiService.setLoader(true);
    try {
      const payload = {
        sortColumn: 'module_name',
        sortDirection: 'asc',
        applicationId: applicationId,
        skipLimit: true
      }

      const { queryParams } = this.buildQueryString(payload);

      const modulesList = await this.restApiService.getRequest({
        path: `xapps-admin/modules`,
        queryParams,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });
      this._moduleLookup.next(modulesList?.data || []);
      return modulesList?.data;
    } catch (err: any) {
      this.logError(err);
      return [];
    } finally{
      this.uiService.setLoader(false);
    }
  }

  async getSubmoduleLookup(moduleId?: number) {
    
    try {
      this.uiService.setLoader(true);
      const payload = {
        sortColumn: 'sub_module_name',
        sortDirection: 'asc',
        moduleId: moduleId,
        skipLimit: true
      }

      const { queryParams } = this.buildQueryString(payload);


      const submodulesList = await this.restApiService.getRequest({
        path: `xapps-admin/submodules`,
        queryParams,
        headers: {
          'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
        }
      });

      this._submoduleLookup.next(submodulesList?.data || [])
      return submodulesList?.data;
    } catch (err: any) {
      this.logError(err);
      return [];
    } finally{
      this.uiService.setLoader(false);
    }
  }

  notifySuccessMessage(response: any){
    this.toastService.fire({
      type: 'success',
      message: response?.statusDescription || 'Success!',
    });
  }
  
  buildFilterListingPayload(Filters: any): GetListPayload {
    return {
        globalSearch: Filters?.searchText || '',
        sortColumn: Filters?.sorting?.prop || 'updated_at',
        sortDirection: Filters?.sorting?.dir || 'desc',
        columnFilters: Filters?.columnFilters || [],
        pagination: {
            pageIndex: Filters?.pagination?.startIndex || 1,
            pageSize: Filters?.pagination?.pageSize || 50,
        },
    };
  }

}
