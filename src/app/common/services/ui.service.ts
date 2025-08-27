import { Location } from '@angular/common';
import { inject, Injectable, Renderer2, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { CurrentRouteDetails, GridColumnResizeRequest } from '../interfaces/global.interface';
import { UserProfileService } from './user-profile.service';
import { getUrl } from 'aws-amplify/storage';
import { RestApiService } from './rest-api.service';

interface ThemeRequest {
  activeTheme: UiTheme;
  syncWithDb?: boolean;
}

interface ProfileImages {
  [email: string]: string;
}

export type UiTheme = 'default' | 'light' | 'dark' | 'classic' | 'nds-dark-blue' | 'nds-light-blue';

@Injectable({
  providedIn: 'root',
})
export class UIService {
  private restApiService = inject(RestApiService);

  private userService= inject(UserProfileService);
  
  private _selectedTabBehavior = new BehaviorSubject<string>('');
  public selectedTab = this._selectedTabBehavior.asObservable();

  private _loaderBehavior = new BehaviorSubject<boolean>(false);
  public loader$ = this._loaderBehavior.asObservable();

  private _forceLoaderBehavior = new BehaviorSubject<boolean>(false);
  public forceLoader$ = this._forceLoaderBehavior.asObservable();

  private isMobileSubject = new BehaviorSubject<boolean>(false);
  public isMobile$ = this.isMobileSubject.asObservable();

  private _activatedTheme = new BehaviorSubject<UiTheme>('default');
  public activatedTheme$ = this._activatedTheme.asObservable();

  private userProfileImages = new BehaviorSubject<ProfileImages>({});
  public userProfileImages$ = this.userProfileImages.asObservable();

  private leftPanelContent = new BehaviorSubject<TemplateRef<any> | null>(null,);
  leftPanelContent$ = this.leftPanelContent.asObservable();

  private _currentRouteDetails = new BehaviorSubject<CurrentRouteDetails | null>(null);
  public currentRouteDetails$ = this._currentRouteDetails.asObservable();

  private isSidebarOpen = new BehaviorSubject<boolean>(false);
  public $isSidebarOpen = this.isSidebarOpen.asObservable();

  constructor(
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private userProfileService: UserProfileService,
  ) {
    this.checkWidth(); // Check width initially
    window.addEventListener('resize', () => this.checkWidth()); // Listen for window resize
  }

  private checkWidth() {
    const isMobile = window.innerWidth < 992;
    this.isMobileSubject.next(isMobile);
  }

  updateleftPanelContent(content: TemplateRef<any> | null) {
    this.leftPanelContent.next(content);
  }
  
  setSelectedTab(newTab: string) {
    this._selectedTabBehavior.next(newTab);
  }

  setLoader(loader: boolean) {
    this._loaderBehavior.next(loader);
  }

  setForceLoader(loader: boolean) {
    this._forceLoaderBehavior.next(loader);
    this._loaderBehavior.next(loader);
  }

  convertToTitleCase(input: string): string {
    const titleCase = input
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return titleCase;
  }

  goBack() {
    if (window.history.length) {
      this.location.back();
    }
  }

  updateQueryParams(params: { [key: string]: any }) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  refreshClassOnBody(
    renderer: Renderer2,
    newClassName: string,
    removeExistingClass = true,
  ) {
    if (removeExistingClass) {
      const body = document.body;
      const classes = Array.from(body.classList);
      classes.forEach((className) => {
        renderer.removeClass(body, className);
      });
    }
    renderer.addClass(document.body, newClassName);
  }

  getUioverlayNoRowsTemplate(message: string): string {
    return `<div style="display: flex; justify-content: center; align-items: center; height: inherit">
    <div class="wrapper-no-data">
      <div class="no-data-avl" style="text-align: center;">
        <img src="assets/images/no-records-found.svg" />
        <h4 style="margin-top: 24px;">${message}</h4>
      </div>
    </div>
  </div>`;
  }

  getNameInitials(name: string) {
    if(!name){
      return '';
    }
    const words = name?.trim().split(' '); 
 
    if (words?.length === 0) return '';

    if (words?.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
  
    const firstLetter = words[0][0].toUpperCase();
    const lastLetter = words[words.length - 1][0].toUpperCase();
  
    return firstLetter + lastLetter;
  }

  shortenLargeNumber(num: number, digits?: number) {
    var units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'],
      decimal;

    for (var i = units.length - 1; i >= 0; i--) {
      decimal = Math.pow(1000, i + 1);

      if (num <= -decimal || num >= decimal) {
        return +(num / decimal).toFixed(digits ? digits : 1) + units[i];
      }
    }
    return num;
  }

  parseSlug(slug: string) {
    return slug.trim()?.toLowerCase().replace(/\s+/g, '_');
  }

  async setTheme(themeRequest: ThemeRequest) {

    if(themeRequest.syncWithDb){
      const userId = this.userProfileService.getLoggedInUserDetails()?.id;

      if(userId){
        this.restApiService.putRequest({
          path: `update-theme`,
          headers: {
            'x-user-info': JSON.stringify(this.userProfileService.getUserInfoForTracking())
          },
          body: {
            theme: themeRequest.activeTheme
          }
        });
      }
    }
    
    document.body.classList.remove('default', 'light', 'dark', 'classic');
    document.body.classList.add(themeRequest.activeTheme);
    this._activatedTheme.next(themeRequest.activeTheme);
  }

  getActiveTheme(): UiTheme {
    return this._activatedTheme.getValue();
  }

  async getProfileImage(email: string){
    if(!email){
      return '';
    }
    const thisEmail = email?.trim();
    const userProfileImages = this.userProfileImages.getValue();
    let profileImageUrl = userProfileImages?.[thisEmail];
    
    if(profileImageUrl !== undefined){
      return profileImageUrl;
    }
    
    try{
      const profileImage = await getUrl({
        path: `users/photos/${thisEmail}.jpeg`,
        options: {
          expiresIn: 3600,
          validateObjectExistence: true
        },
      });
      
      profileImageUrl = profileImage?.url?.toString() || '';
      userProfileImages[thisEmail] = profileImageUrl;
      this.userProfileImages.next(userProfileImages);

      return profileImageUrl;
    } catch (err) {
      userProfileImages[thisEmail] = '';
      this.userProfileImages.next(userProfileImages);

      return '';
    }
  }

  setCurrentRouteDetails(details: CurrentRouteDetails | null) {
    this._currentRouteDetails.next(details);
  }

  getCurrentRouteDetails() {
    return this._currentRouteDetails.getValue();
  }

  toggleMainSidebar(value?: boolean){
    if(!value){
      this.isSidebarOpen.next(value||false)
      return
    }
    this.isSidebarOpen.next(!this.isSidebarOpen.getValue());
  }
}
