import { Injectable, signal } from '@angular/core';
// import { DefaultService } from '../swagger/api/services';
import { BehaviorSubject} from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';
import { ToastService } from 'src/app/common/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { UserProfileService } from 'src/app/common/services/user-profile.service';
import { DomSanitizer } from '@angular/platform-browser';
import { GlobalDataService as GS } from 'src/app/common/services/global-data.service';
 
import {
  FavoriteListRequest,
  ApiStatus,
  RecentListRequest,
  TableauAuthCredentials,
  UserFavorites,
  UserRecents,
  TableauPersona,
  AddFavoritesOfUser,
  DeleteFavorite,
  EnvironmentProject,
  LocalProjectRequest,
  LocalViewRequest,
  FilterState,
  TableauView,
  JWTTokenRequest,
  MultipleLocalViewRequest,
  SetPersonaPayload,
  SetEnvironmentPayload,
  LeftPanelData,
  APIReportGroup
} from '../interfaces';
import { get } from 'aws-amplify/api';
import { LocalStorageService } from '@app/common/services/local-storage.service';
import { Router } from '@angular/router';
import { RestApiService } from '@app/common/services/rest-api.service';
 
// const tableauApiUrl = 'tableau-api';
const jwtTokenRefreshInterval = 9;
const timeoutDuration = 1000 * 60 * jwtTokenRefreshInterval;
let jwtTokenRefreshTimeout: ReturnType<typeof setTimeout>;
 
@Injectable({
  providedIn: 'root',
})
export class TableauGlobalDataServiceNew {
   private client: any = '';
  
    // Subject to hold the list of Tableau personas
    private _tableauPersonas = new BehaviorSubject<Array<TableauPersona> | null>(null);
    tableauPersonas$ = this._tableauPersonas.asObservable();
    
    private _environmentProjects = new BehaviorSubject<Record<string, EnvironmentProject> | null>(null);
    environmentProjects$ = this._environmentProjects.asObservable();
  
    private _environments = new BehaviorSubject<Array<string> | null>(null);
    environments$ = this._environments.asObservable();
  
    private _jwtToken = new BehaviorSubject<string>('');
    jwtToken$ = this._jwtToken.asObservable();
  
    private _viewBaseUrl = new BehaviorSubject<string>('');
    viewBaseUrl$ = this._viewBaseUrl.asObservable();
  
    // Subject to hold user recent views
    private _userRecents = new BehaviorSubject<Array<UserRecents> | null>(null);
    userRecents$ = this._userRecents.asObservable();
  
    // Subject to hold thumbnails of views
    private _viewThumbnails = new BehaviorSubject<{[key: string]: string}>({});
    viewThumbnails$ = this._viewThumbnails.asObservable();
  
    filterStates = new BehaviorSubject<Record<string, FilterState> | null>(null);
    filterStates$ = this.filterStates.asObservable()
    
    // Array to track API statuses
    private apiStatuses: Array<ApiStatus> = [];
    TableauPersonaModel:any;
  
    private _isHomeExpanded = new BehaviorSubject<boolean>(true);
    isHomeExpanded$ = this._isHomeExpanded.asObservable();
  
    private _isconfigExpanded = new BehaviorSubject<boolean>(true);
    isconfigExpanded$ = this._isconfigExpanded.asObservable();
  
    private _sliderState = new BehaviorSubject<boolean>(false);
    sliderState$ = this._sliderState.asObservable();
     
  private _leftsiderbar = new BehaviorSubject<boolean>(false);
  leftsiderbar$ = this._leftsiderbar.asObservable();

  private _viewDetailSidebarState = new BehaviorSubject<boolean>(false);
  public viewDetailSidebarState$ = this._viewDetailSidebarState.asObservable();
  
    private _viewLoadedFrom = new BehaviorSubject<string | null>(null);
    viewLoadedFrom$ = this._viewLoadedFrom.asObservable();
  
    setViewLoadedFrom(loadedFrom: string){
      this._viewLoadedFrom.next(loadedFrom);
    }
    
    private _leftPanelData = new BehaviorSubject<LeftPanelData | null>(null);
    leftPanelData$ = this._leftPanelData.asObservable();
    
    // private _viewDetailSidebarState = new BehaviorSubject<boolean>(false);
    // public viewDetailSidebarState$ = this._viewDetailSidebarState.asObservable();
  
    selectedViews = signal<string[] | null>(null);
    private loadingFavoriteViewIds: string[] = [];
  
    // Update filter state by key
    updateFilterState(key: string, newState: Partial<FilterState>) {
      if (!key) return;
      const currentStates = this.filterStates.getValue();
      this.filterStates.next({
        ...currentStates,
        [key]: {
          ...currentStates?.[key],
          ...newState
        }
      });
    }
  
    getFilterStateForProject(key: string) {
      return this.filterStates.getValue()?.[key];
    }
  
    constructor(
      private uiService: UIService,
      private toastService: ToastService,
      private http: HttpClient,
      private userProfileService: UserProfileService,
      private sanitizer: DomSanitizer,
      private gs: GS,
      private localStorageService: LocalStorageService,
      private router: Router,
      private restApiService: RestApiService
    ) {}
  
    // Checks if data for a specific API code should be reloaded based on existing status
    reloadData(apiCode: string) {
      const thisApiStatus = this.apiStatuses.find(
        (apiStatus: ApiStatus) =>
          apiStatus.apiCode === apiCode && apiStatus.statusCode,
      );
      return !thisApiStatus?.apiCode ? true : false;
    }
  
    // Stores the response status of an API call with its corresponding code
    setApiResponse(apiCode: string, statusCode: number) {
      this.apiStatuses.push({
        apiCode,
        statusCode,
      });
    }
  
    // Removes the stored API status entry for the specified API code
    unsetApiResponse(apiCode: string) {
      this.apiStatuses = this.apiStatuses.filter(
        (status) => status.apiCode !== apiCode,
      );
    }
  
    /**
     * Fetches authentication credentials for the currently logged-in user by sending a POST request
     * to the Tableau sign-in endpoint. Stores the credentials if the request is successful.
     * Displays an error toast if the request fails.
     *
     * @returns {Promise<void>} A promise that resolves once the operation completes.
     */
    async fetchAuthCredentials() {
      try {
        const result = await this.restApiService.getRequest({
          path: `tableau/auth-token`
        });
  
        if (result?.credentials) {
          this.storeAuthCredentials(result.credentials);
        }
  
        return true;
      } catch (err: any) {
        const error = JSON.parse(err?.response.body);
        let errorMessage = `${error?.error?.summary}: ${error?.error?.detail}`;
        if(error?.error?.code === '401001'){
          errorMessage = `You do not have tableau access. Please reach out to tableau team to get the report's access.`
        }
        this.toastService.fire({
          type: 'error',
          message: errorMessage || 'Something went wrong',
        });
        return false;
      }
    }
  
    // Stores Tableau authentication credentials in local storage after encoding
    storeAuthCredentials(credentials: TableauAuthCredentials) {
      const appConfig = this.localStorageService.getLocalStorage();
      appConfig.tableau = { ...appConfig.tableau, tableauAuthCredentials: btoa(JSON.stringify(credentials))}
      this.localStorageService.setLocalStorage(appConfig)
    }
  
    // Retrieves and decodes Tableau authentication credentials from local storage
    retrieveAuthCredentials(): TableauAuthCredentials | null {
      const appConfig = this.localStorageService.getLocalStorage();
      if (appConfig?.tableau?.tableauAuthCredentials) {
        return JSON.parse(atob(appConfig?.tableau?.tableauAuthCredentials))
      }
      return null;
    }
  
    /**
     * Loads the initial Tableau data package including all global views, workbooks, and root-level projects.
     * Filters out child projects without associated views and updates the tableau project state.
     * Handles authentication errors by retrying after refreshing credentials.
     *
     * @returns {Promise<void>} A promise that resolves when the initial data is fully loaded.
     */
    async loadInitialPackage() {
      try{
        this.uiService.setLoader(true);
        const selectedEnvironment = this.userProfileService.getAppConfig('ubi')?.environment;
        const headers = await this.getAPIHeaders();
        if(!headers){
          this._environmentProjects.next({});
          return;
        }
        const result = await this.restApiService.getRequest({
          path: `tableau/environment-projects`,
          headers,
          queryParams: {
            environmentName: selectedEnvironment?.toString() || 'DEV'
          }
        });
        
        this._environmentProjects.next(result?.selectedEnvironment?.projects);
        
        this._environments.next(result?.environments || []);
  
        if(result?.selectedEnvironment?.name){
          this._tableauPersonas.next(result?.groups?.map((group: APIReportGroup) => {
            return {
              environment: result.selectedEnvironment.name,
              name: group.name,
              reports: group.reports || []
            }
          }));
        }
        if (selectedEnvironment !== result?.selectedEnvironment?.name){
          
          await this.setEnvironment({
            name: result?.selectedEnvironment?.name,
            dbSync: true
          });
        } else {
          const selectedTableauPersona = this.retrieveTableauPersona();
          if(!this._tableauPersonas.getValue()?.some((tableauPersona) => tableauPersona.name === selectedTableauPersona)){
            this.setSelectedTableauPersona({
              name: 'Home',
              dbSync: true
            });
          }
        }
        
        this.setApiResponse('initial-package', 200);
      } catch (err: any) {
        
        const error = JSON.parse(err?.response?.body);
        if (error?.error?.code === '401002') {
          this.clearAuthCredentials();
          const credentialsFetched = await this.fetchAuthCredentials();
          if(credentialsFetched){
            this.loadInitialPackage();
            return;
          }
        }
        this._environmentProjects.next({});
        this.setApiResponse('initial-package', 520);
        this.toastService.fire({
          type: 'error',
          message: error?.error?.detail || 'Something went wrong',
        });
      } finally {
        this.uiService.setLoader(false);
      }
    }
  
    clearAuthCredentials (){
      const appConfig = this.localStorageService.getLocalStorage();
      appConfig.tableau = { ...appConfig.tableau, tableauAuthCredentials: undefined}
      this.localStorageService.setLocalStorage(appConfig)
    }
    /**
     * Retrieves the thumbnail for a specific view.
     * Uses a secure POST request and sanitizes the returned base64 image URL.
     *
     * @param {string} id - The ID of the view.
     * @param {string} workbookId - The ID of the workbook the view belongs to.
     * @returns {Promise<string>} A sanitized base64 thumbnail image URL.
     */
    async getViewThumbnail(id: string, workbookId: string) {
      try {
        let allViewsThumbnail = this._viewThumbnails.getValue();
        let imageUrl = allViewsThumbnail[id];
  
        if (!imageUrl) {
          const response = await this.restApiService.postRequest({
            path: `tableau/view-thumbnail`,
            body: {
              view: {
                id,
                workbookId,
              },
            },
            headers: await this.getAPIHeaders()
          });
  
          imageUrl =
            (this.sanitizer.bypassSecurityTrustUrl(
              'data:image/jpeg;base64,' +
                this.arrayBufferToBase64(response?.thumbnail?.data),
            ) as string) || '';
          allViewsThumbnail[id] = imageUrl;
          this._viewThumbnails.next(allViewsThumbnail);
        }
        return imageUrl;
      } catch (err: any) {
        const error = JSON.parse(err?.response.body);
        if (error?.error?.code === '401002') {
          this.clearAuthCredentials();
          const credentialsFetched = await this.fetchAuthCredentials();
          if(credentialsFetched){
            this.getViewThumbnail(id, workbookId);
            return;
          }
        }
        this.toastService.fire({
          type: 'error',
          message: error?.error?.detail || 'Something went wrong',
        });
        return '';
      }
    }
  
    getFavorites(){
      return Object.values(this._environmentProjects.getValue() || {}).flatMap(project => project.views)?.filter((view) => view?.isFavorite) || [];
    }
    /**
     * Retrieves the list of favorite items (views or workbooks) for the currently authenticated user.
     *
     * @param {FavoriteListRequest} [request] - Optional request configuration.
     * @returns {Promise<void>} A promise that resolves when the favorites are loaded.
     */
    async getFavoritesOfUser(request?: FavoriteListRequest) {
      try {
        if(!request?.silentCall){
          this.uiService.setLoader(true);
        }
        
        const headers = await this.getAPIHeaders();
        if(!headers){
          this._environmentProjects.next({});
          this.uiService.setLoader(false);
          return;
        }
  
        const favoriteViewIds = await this.restApiService.getRequest({
          path: `tableau/favorites`,
          headers
        });
  
        const currentProjects = this._environmentProjects.getValue();
        if(currentProjects) {
          const updated = Object.fromEntries(
            Object.entries(currentProjects).map(([key, project]) => [
              key,
              {
                ...project,
                views: project.views?.map(view => ({
                  ...view,
                  isFavorite: favoriteViewIds.includes(view?.id)
                }))
              }
            ])
          );
          this._environmentProjects.next(updated);
        }
  
        this.setApiResponse('user-favorites', 200);
      } catch (err: any) {
        const error = err?.response?.body ? JSON.parse(err.response.body) : undefined;
        this.toastService.fire({
          type: 'error',
          message: error?.error?.detail || err?.toString() || 'Something went wrong',
        });
        return;
      } finally {
        if(!request?.silentCall){
          this.uiService.setLoader(false);
        }
      }
    }
  
    /**
     * Adds a content item (view, workbook, project, etc.) to a user's Tableau favorites.
     *
     * @param {AddFavoritesOfUser} payload - The favorite item details including label and content type(s).
     * @returns {Promise<any>} The API response from Tableau or an empty array on error.
     */
    async addToFavorites(payload: AddFavoritesOfUser) {
      const viewId = payload?.view?.id || '';
      try {
        const result = await this.restApiService.putRequest({
          path: `tableau/favorites`,
          body: {
            viewId,
            addToFavorites: true
          },
          headers: await this.getAPIHeaders()
        });
  
        return result;
      } catch (err: any) {
        const error = JSON.parse(err?.response.body);
        this.toastService.fire({
          type: 'error',
          message: error?.error?.detail || 'Something went wrong'
        });
        return [];
      } finally{
        this.loadingFavoriteViewIds = this.loadingFavoriteViewIds.filter(id => id !== viewId);
      }
    }
  
    /**
     * Deletes a view from a user's Tableau favorites list.
     *
     * @param {DeleteFavorite} payload - The ID of the view to remove from favorites.
     * @returns {Promise<any>} The API response from Tableau or an empty array on error.
     */
    async deleteToFavorite(payload: DeleteFavorite) {
      const viewId = payload?.id || '';
      try {
        const headers = await this.getAPIHeaders();
        const result = await this.restApiService.deleteRequest({
          path: `tableau/favorites/${viewId}`,
          headers
        });
  
        return result;
      } catch (err: any) {
        const error = JSON.parse(err?.response.body);
        this.toastService.fire({
          type: 'error',
          message: error?.error?.detail || 'Something went wrong'
        });
      } finally{
        this.loadingFavoriteViewIds = this.loadingFavoriteViewIds.filter(id => id !== viewId);
      }
    }
    
    // Retrieves a project along with its associated workbooks and views from the local store
    getLocalEnvironmentProject(request: LocalProjectRequest) {
      const environmentProjects = Object.values(this._environmentProjects.getValue() || {}).flatMap(project => project);
      const thisProject = environmentProjects?.find((project) => project?.id === request.projectId);
      if(!thisProject?.id){
        return;
      }
      return thisProject;
    }
  
    getLocalEnvironmentProjectByViewId(viewId: string) {
      const environmentProjects = Object.values(this._environmentProjects.getValue() || {}).flatMap(project => project);
      const thisProject = environmentProjects?.find((project) => project?.views?.some((view) => view.id === viewId));
      if(!thisProject?.id){
        return;
      }
      return thisProject;
    }
  
    // Retrieves a view by its ID and assigns the associated workbook from the local store
    getLocalView(request: LocalViewRequest) {
      const views = Object.values(this._environmentProjects.getValue() || {}).flatMap(project => project.views);
      const thisView = views?.find((view) => view?.id === request.viewId);
      if(!thisView?.id){
        return;
      }
      return thisView;
    }
  
    // Retrieves a view by its ID and assigns the associated workbook from the local store
    getLocalViews(request: MultipleLocalViewRequest) {
      const views = Object.values(this._environmentProjects.getValue() || {}).flatMap(project => project.views);
      const filteredViews = views?.filter((view) => request.viewIds?.includes(view?.id || '')) || [];
      // Sort views based on the order of request.viewIds
      return filteredViews.sort((a: any, b: any) => request.viewIds.indexOf(a.id) - request.viewIds.indexOf(b.id));
    }
  
    /**
     * Fetches recent content accessed by the logged-in user.
     * @param request - Optional parameter to control silent call and limit
     * Populates the `_userRecents` observable with recent views and workbooks.
     */
    async getRecentsOfUser(request?: RecentListRequest) {
      try {
        if(!request?.silentCall){
          this.uiService.setLoader(true);
        }
  
        // if(!Object.keys(this._environmentProjects.getValue() || {})?.length){
        //   this._userRecents.next([]);
        //   this.uiService.setLoader(false);
        //   return;
        // }
  
        const headers = await this.getAPIHeaders();
        if(!headers){
          this._userRecents.next([]);
          this.uiService.setLoader(false);
          return;
        }
  
        const recents = await this.restApiService.getRequest({
          path: `tableau/recents`,
          headers
        });
  
        this._userRecents.next(recents);
        this.setApiResponse('user-recents', 200);
        this.uiService.setLoader(false);
        return recents;
      } catch (err: any) {
        const error = JSON.parse(err?.response.body);
        if (error?.error?.code === '401002') {
          this.clearAuthCredentials();
          const credentialsFetched = await this.fetchAuthCredentials();
          if(credentialsFetched){
            this.getRecentsOfUser(request);
            return;
          }
        }
        this._userRecents.next([]);
        this.uiService.setLoader(false);
        this.setApiResponse('user-recents', 520);
        this.toastService.fire({
          type: 'error',
          message: error?.error?.detail || 'Something went wrong',
        });
      } 
    }
  
    // Converts an ArrayBuffer to a Base64-encoded string
    arrayBufferToBase64(buffer: ArrayBuffer): string {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    }
  
    /**
     * Fetches the list of non-deleted users, excluding the system user.
     * @returns Promise containing the list of users.
     */
    async getUsers() {
      try {
        const apiUsers = await this.gs.tableRecords({
          tableModel: 'yess',
          filter: {
            isDeleted: {
              ne: true,
            },
            email: {
              ne: this.userProfileService.getSystemUser()?.email,
            },
          },
          selectionSet: [
            'id',
            'firstName',
            'lastName',
            'email'
          ],
        });
  
        return apiUsers || [];
      } catch (err: any) {
        const error = err?.response?.body ? JSON.parse(err.response.body) : undefined;
        this.toastService.fire({
          type: 'error',
          message: error?.error?.detail || err?.toString() || 'Something went wrong',
        });
        this.uiService.setLoader(false);
        return;
      }
    }
  
    // Returns the list of child projects from the root Tableau project
    getEnvironmentProjects(){
      return this._environmentProjects.getValue() || null;
    }
  
     // Returns the list of child projects from the root Tableau project
     getRecentView(){
      return this._userRecents.getValue() || null;
    }
  
    /**
     * Retrieves a JWT token for the currently logged-in user.
     * @returns {Promise<void>}
     */
    
    async getJWTToken(req?: JWTTokenRequest): Promise<string> {
      try {
        let jwtToken = this._jwtToken.getValue();
        if(!jwtToken || req?.forceAPICall){
          const restOperation = get({ 
                apiName: 'SSP',
                path: `tableau/jwt`,
              });
  
          const response = await restOperation.response;
          const data = await response.body.json() as any;
          jwtToken = response.headers['x-jwt-token'] as string || '';
          if(!jwtToken){
            throw new Error('Invalid JWT token!');
          }
          this._jwtToken.next(jwtToken);
  
          const viewBaseUrl = data.viewBaseUrl as string || '';
          if(!viewBaseUrl){
            throw new Error('Invalid view base url!');
          }
          jwtTokenRefreshTimeout = setTimeout(() => {
            this.getJWTToken({
              forceAPICall: true
            });
          }, timeoutDuration);
  
          this._viewBaseUrl.next(viewBaseUrl);
        }
        return jwtToken;    
      } catch (err: any) {
        const error = err?.response?.body ? JSON.parse(err.response.body) : undefined;
        this.toastService.fire({
          type: 'error',
          message: error?.error?.detail || err?.toString() || 'Something went wrong',
        });
        return '';
      }
    }
  
    getViewBaseUrl(){
      return this._viewBaseUrl.getValue() || '';
    }
  
    /**
     * Toggles the favorite status of a Tableau view.
     * 
     * - If the view is not currently a favorite, it will be added.
     * - If the view is already a favorite, it will be removed.
     * 
     * @param {TableauView} view - The Tableau view object to be added or removed from favorites.
     */
    toggleFavorite(view: TableauView) {
      //  Toggle the local favorite status flag
      if(this.loadingFavoriteViewIds.includes(view.id)){
        return;
      }
      this.loadingFavoriteViewIds.push(view.id);
      view.isFavorite = !view.isFavorite;
      // Attempt to add the view to favorites
      if(view?.isFavorite) {
        this.addToFavorites({
          label: 'add-view-favorite',
          view: {
            id: view.id
          }
        });
      } else {
        this.deleteToFavorite({
          id: view.id
        });
      }
      const currentProjects = this._environmentProjects.getValue();
      if (currentProjects) {
        const updated = Object.fromEntries(
          Object.entries(currentProjects).map(([key, project]) => [
            key,
            {
              ...project,
              views: project.views?.map(v => v.id === view.id ? { ...v, isFavorite: view.isFavorite } : v)
            }
          ])
        );
        this._environmentProjects.next(updated);
      }
    }
  
    //Fetching the listing API's based on the path
    async loadRouteData(path: string){
      switch (path) {
        case ':id/:loadedFrom/:selectedViews':
          if (this.reloadData('initial-package')) {
            await this.loadInitialPackage();
          }
          break;
      }
    }
  
    async getAPIHeaders(){
      let credentials = this.retrieveAuthCredentials();
  
      if (!credentials) {
        await this.fetchAuthCredentials();
        credentials = this.retrieveAuthCredentials();
      }
  
      if (!credentials) {
        return;
      }
  
      const {
        site: { id: siteId },
        user: { id: userId },
        token,
      } = credentials;
      
      return {
        'Content-Type': 'application/json',
        'X-Tableau-Auth-Token': token,
        'X-Tableau-Site-Id': siteId,
        'X-Tableau-user-Id': userId
      }
    }
  
    async changeEnvironment(env: string) {
      this.unsetApiResponse('initial-package');
      this.unsetApiResponse('user-recents');
      this._environmentProjects.next(null);
      this._userRecents.next(null);
      this.filterStates.next(null);
      console.log("====change filter state...")
      this._environments.next(null);
      this._tableauPersonas.next(null);
      this.setEnvironment({
        name: env,
        dbSync: true
      });
      await this.loadInitialPackage();
      this.router.navigate(['/ubi/home']); 
    }
  
    async setEnvironment(payload: SetEnvironmentPayload){
      const newTableauConfig = {
        "environment": payload.name,
        "default_group_name": 'Home'
      };
  
      this.userProfileService.updateAppConfig({
        appSlug: 'ubi',
        config: newTableauConfig,
        dbSync: payload.dbSync
      });
    }
  
    // Set the selected Tableau persona and persist it in local storage
    async setSelectedTableauPersona(payload: SetPersonaPayload){
      const currentTableauConfig = this.userProfileService.getAppConfig('ubi');
      const newTableauConfig = {
        "environment": currentTableauConfig?.environment || undefined,
        "default_group_name": payload.name
      };
  
      this.userProfileService.updateAppConfig({
        appSlug: 'ubi',
        config: newTableauConfig
      });

      this.userProfileService.updateAppConfig({
        appSlug: 'ubi',
        config: newTableauConfig,
        dbSync: payload.dbSync
      });
    }
  
    // Retrieve the selected Tableau persona from local storage
    retrieveTableauPersona(): string | null {
      return this.userProfileService.getAppConfig('ubi')?.default_group_name || 'Home';
    }
  
  
    setConfigOptionState(state: boolean){
      this._isconfigExpanded.next(state);
    }
  
    setHomeOptionState(state: boolean){
      this._isHomeExpanded.next(state);
    }
  
    clearJWTInterval(){
      if(jwtTokenRefreshTimeout){
        clearTimeout(jwtTokenRefreshTimeout);
      }
    }
    
    emptizeTableauCreds(){
      this._jwtToken.next('');
      this._viewBaseUrl.next('');
    }
  
    applyFilter(views: TableauView[], filterState?: any): TableauView[] {
      let filteredViews = [...views];
      // Global search
      if (filterState?.globalSearch) {
        const searchTerm = filterState.globalSearch.trim().toLowerCase();
        filteredViews = filteredViews.filter(view => {
          const nameMatches = view.name.toLowerCase().includes(searchTerm);
          const tag = view?.tags?.tag || [];
          const tagsMatch = tag.length && tag.some(t => t.label.toLowerCase().includes(searchTerm));
          const descriptionMatch = view?.description && view?.description?.toLowerCase().includes(searchTerm);
          return nameMatches || tagsMatch || descriptionMatch;
        });
      }
      // Date filters
      if (filterState?.dateFilters && Object.values(filterState.dateFilters).some(Boolean)) {
        const { modifiedAfter, modifiedBefore, createdAfter, createdBefore } = filterState.dateFilters;
        const checkDate = (viewDateStr?: string, afterStr?: string, beforeStr?: string) => {
          if (!viewDateStr) return true;
          const viewDate = new Date(viewDateStr);
          const after = afterStr ? new Date(afterStr) : null;
          const before = beforeStr ? new Date(beforeStr) : null;
          if (after && before) {
            if (after <= before) {
              return viewDate >= new Date(after.setHours(0, 0, 0, 0)) &&
                     viewDate <= new Date(before.setHours(23, 59, 59, 999));
            } else {
              return viewDate <= new Date(before.setHours(23, 59, 59, 999)) ||
                     viewDate >= new Date(after.setHours(0, 0, 0, 0));
            }
          }
          if (after) return viewDate >= new Date(after.setHours(0, 0, 0, 0));
          if (before) return viewDate <= new Date(before.setHours(23, 59, 59, 999));
          return true;
        };
        filteredViews = filteredViews.filter(view => 
          checkDate(view.createdAt, createdAfter, createdBefore) &&
          checkDate(view.updatedAt, modifiedAfter, modifiedBefore)
        );
      }
  
      // Sorting
      // if (filterState?.sorting) {
      //   filteredViews.sort((a, b) =>
      //     filterState.sorting === 'asc'
      //       ? a.name.localeCompare(b.name)
      //       : b.name.localeCompare(a.name)
      //   );
  
  
    //       // Sorting
    // if (filterState?.sorting) {
    //   const order =  filterState.sorting === 'asc'? 1 : -1;
    //   const sortBy = filterState.sort.toLowerCase();
   
    //   filteredViews.sort((a: any, b: any) => {
    //     let aValue = a[sortBy];
    //     let bValue = b[sortBy];
   
    //     // Handle undefined/null values gracefully
    //     if (aValue === undefined || aValue === null) return 1;
    //     if (bValue === undefined || bValue === null) return -1;
   
    //     // If it's a string, use localeCompare
    //     if (typeof aValue === 'string' && typeof bValue === 'string') {
    //       return aValue.localeCompare(bValue) * order;
    //     }
   
    //     // If it's a Date, compare timestamps
    //     if (aValue instanceof Date && bValue instanceof Date) {
    //       return (aValue.getTime() - bValue.getTime()) * order;
    //     }
   
    //     // Default numeric comparison
    //     return (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) * order;
    //   });
    // }
    
      const order = filterState.sorting.dir === 'asc' ? 1 : -1;
      const sortBy = filterState.sorting.order;
  
      filteredViews.sort((a, b) => {
        let aValue, bValue;
  
        // Map sortBy to actual property path
        switch (sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'project':
            aValue = a.project?.name;
            bValue = b.project?.name;
            break;
          case 'workbook':
            aValue = a.workbook?.name;
            bValue = b.workbook?.name;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
            break;
          case 'updatedAt':
            aValue = new Date(a.updatedAt);
            bValue = new Date(b.updatedAt);
            break;
          default:
            aValue = a.name;
            bValue = b.name;
        }
  
        // Handle undefined/null values gracefully
        if (aValue == null) return 1;
        if (bValue == null) return -1;
  
        // String comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * order;
        }
  
        // Date comparison
        if (aValue instanceof Date && bValue instanceof Date) {
          return (aValue.getTime() - bValue.getTime()) * order;
        }
  
        // Fallback to numeric or default comparison
        return (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) * order;
      });
      return filteredViews;
    }
  
    addToSelectedViews(viewId: string) {
      if (!viewId) return;
      const current = this.getSelectedViews();
      if (!current.includes(viewId)) {
        this.selectedViews.set([...current, viewId]);
      }
    }
  
    clearSelectedViews(){
      this.selectedViews.set([]);
    }
    
    getSelectedViews() {
      return this.selectedViews() || [];
    }
    
  
    removeFromSelectedViews(viewId: string) {
      if (!viewId) return;
      const current = this.getSelectedViews();
      this.selectedViews.set(current.filter(id => id !== viewId));
    }
  
    setLeftPanelData(data: LeftPanelData){
      this._leftPanelData.next(data);
    }
  
    setViewDetailSidebarState(state: boolean) {
      this._viewDetailSidebarState.next(state);
    }
  
    getViewDetailSidebarState() {
      return this._viewDetailSidebarState.getValue() || false;
    }
  
    updateEnvProjects(envProjects: Record<string, EnvironmentProject>){
      this._environmentProjects.next(envProjects);
    }
  
   
  // slider toggle function
  toggleSlider(newState?: boolean): void {
    if (newState != undefined) {
      this._sliderState.next(newState);
      return;
    }
    this._sliderState.next(!this._sliderState.getValue());
  }
  
  // left-slider toggle function
  toggleSubLeftSlider(newState?: boolean): void {
    if (newState != undefined) {
      this._leftsiderbar.next(newState);
      return;
    }
    this._leftsiderbar.next(!this._leftsiderbar.getValue());
  }
}