// This is a common authentication and authorization service that checks if the user is authenticated and checks of some action of a module of an app is authorized to a logged in user or not
 
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { ToastService } from 'src/app/common/services/toast.service';
import { messages } from '../constants';
import { UIService } from './ui.service';
import { UserProfileService } from './user-profile.service';
import { RestApiService } from './rest-api.service';
import { PermittedApplicationService } from './permitted-appolication.service';
import { PermittedApplication } from '../interfaces/global.interface';
import { GlobalDataService } from './global-data.service';

interface PermissionRequest {
  appSlug: string;
  moduleSlug: string;
  permissionSlug: string;
  submoduleSlug?: string;
  ignoreRedirection?: boolean;
  strictMode?: boolean;
  parentRoutePath?: string;
}
 
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  
  // Flag to ensure the default route (or initial data) is only loaded once.
  private isDefaultRouteLoaded = false;
 
  constructor(
    private router: Router,
    private toastService: ToastService,
    private uiService: UIService,
    private userProfileService: UserProfileService,
    private permittedApplicationService: PermittedApplicationService,
    private restApiService: RestApiService,
    private globalDataService: GlobalDataService
  ) { }
 
  async handleAuthentication(
    token: any,
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    // const userDetails = {
    //   email: userProfileInfo.tokens?.idToken?.payload['email'],
    //   firstName: userProfileInfo.tokens?.idToken?.payload['given_name'],
    //   lastName: userProfileInfo.tokens?.idToken?.payload['family_name'],
    // };
 
    try {
      const isValid = await this.getUserPermissions(token, route, state);
      return isValid;
    } catch (err: any) {
      // Don't redirect here, interceptor will handle token expiry
      console.error('Non-HTTP Authentication error:', err);
      return false;
    }
  }
 
  /**
   * Saves the user data into the database if not already present.
   * Retrieves user permissions and sets up permitted applications for the session.
   * Handles redirection based on available applications and routes.
   *
   * @param {any} userData - The user data object containing details like email, first name, and last name.
   * @param {any} route - The current activated route used to determine routing logic.
   * @returns {Promise<boolean>} - Returns true if no redirection is triggered, otherwise false.
   */
  async getUserPermissions(token: any, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    try {
      // const { email, firstName, lastName } = userData;
      // if (!email || !firstName || !lastName) {
      //   throw Error('Invalid cognito user!');
      // }
 
      const loggedInUserProfile = await this.restApiService.getRequest({
        path: `me`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if(!loggedInUserProfile?.data?.userProfile?.id){
        throw Error('Invalid user!');
      }
 
      //throw error if the user is inactive as inactive users are not allowed to access the application
      if (!loggedInUserProfile?.data?.userProfile?.isActive) {
        throw Error('Inactive user!');
      }

      const theme = loggedInUserProfile?.data?.userProfile?.theme || 'light';

      //publish the theme to subject
      this.uiService.setTheme({ activeTheme: theme });
 
      //get profile Image and permitted applications of the logged in user
      // const [profileImageUrl] = await Promise.all([
      //   this.uiService.getProfileImage(email)
      // ]);

      const applications = loggedInUserProfile?.data?.applications as PermittedApplication[] || [];

      this.userProfileService.publishLoggedInUserData({
        id: loggedInUserProfile?.data?.userProfile?.id,
        email: loggedInUserProfile?.data?.userProfile?.email || '',
        firstName: loggedInUserProfile?.data?.userProfile?.firstName || '',
        lastName: loggedInUserProfile?.data?.userProfile?.lastName || '',
        fullName: loggedInUserProfile?.data?.userProfile?.fullName || '',
        nameInitials: this.uiService.getNameInitials(loggedInUserProfile?.data?.userProfile?.fullName || ''),
        // profileImageUrl: profileImageUrl,
        config: loggedInUserProfile?.data?.userProfile?.config || null,
        permissions: loggedInUserProfile?.data?.permissions || [],
        applications: loggedInUserProfile?.data?.applications || []
      });
      this.permittedApplicationService.setPermittedApplications(applications);

      let singleAppAssignPath = '';
      if(applications?.length > 0){
        const isSingleAppPermitted = applications.every(p => p.id === applications[0].id);
        if(isSingleAppPermitted){
          singleAppAssignPath = `/${applications?.[0]?.slug?.toLowerCase().replace(/[_ ]/g, '-')}`;
        }

      }
      if (
        singleAppAssignPath &&
        singleAppAssignPath != state.url &&
        !this.isDefaultRouteLoaded
      ) {
        this.router.navigate([singleAppAssignPath]);
        this.isDefaultRouteLoaded = true;
        return false;
      }
      return true;
 
    } catch (err: any) {
      this.uiService.setLoader(false);
      this.toastService.fire({
        type: 'error',
        message: err?.error?.statusMessage || err?.toString() || 'Unknown Error',
      });
      throw err;
    }
  }
  
  hasPermissionToAccessModule(permissionRequest: PermissionRequest): boolean {
    const permissions = this.userProfileService.getLoggedInUserPermissions();
    const appSlug = permissionRequest.appSlug;
    const moduleSlug = permissionRequest.moduleSlug;
    const submoduleSlug = permissionRequest.submoduleSlug;
    const permissionSlug = permissionRequest.permissionSlug?.toLowerCase();
  
    // Handle view/list access in non-strict mode
    if (!permissionRequest.strictMode && (permissionSlug === 'view' || permissionSlug === 'list')) {
      const matchingModule = permissions?.find(p =>
        p.aSlug === appSlug &&
        p.mSlug === moduleSlug
      );
  
      if (matchingModule?.pSlug) return true;
  
      if (submoduleSlug) {
        const matchingSubmodule = permissions?.find(p =>
          p.aSlug === appSlug &&
          p.mSlug === moduleSlug &&
          p.smSlug === submoduleSlug
        );
        if (matchingSubmodule?.pSlug) return true;
      } else {
        const anySubmoduleExists = permissions?.some(p =>
          p.aSlug === appSlug &&
          p.mSlug === moduleSlug &&
          p.smSlug !== null
        );
        if (anySubmoduleExists) return true;
      }
  
      return this.handleInvalidAccess(permissionRequest);
    }
  
    // Full permission check with submodule consideration
    const hasPermission = permissions?.some(p =>
      p.aSlug === appSlug &&
      p.mSlug === moduleSlug &&
      (p.smSlug === null ? true : p.smSlug === submoduleSlug ? true : false) &&
      p.pSlug === permissionSlug
    );
  
    if (hasPermission) return true;
  
    return this.handleInvalidAccess(permissionRequest);
  }
   
  private handleInvalidAccess(request: PermissionRequest): boolean {
    this.performInvalidAccessAction(request?.ignoreRedirection, request?.parentRoutePath);
    return false;
  }
 
  // Handles invalid access by stopping the loader, showing an error toast, and redirecting the user.
  performInvalidAccessAction(ignoreRedirection = false, parentRoutePath = '') {
    if (!ignoreRedirection) {
      this.uiService.setLoader(false);
      this.toastService.fire({
        type: 'error',
        message: messages.error.InvalidAccess.message,
      });
      if (parentRoutePath) {
        this.router.navigate([parentRoutePath]);
      } else {
        this.router.navigate(['/my-apps']);
      }
    }
  }
 
  
  /**
   * Log out the user and clear local storage
   * @return {void}
   */

  async logOut(): Promise<void> {
    this.globalDataService.logout();
    this.router.navigate(['/login']);
  }
}
