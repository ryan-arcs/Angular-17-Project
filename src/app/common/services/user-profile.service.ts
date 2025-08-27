import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserProfile } from '../interfaces/global.interface';
import { environment } from 'src/environments/environment';
import { PermittedApplicationService } from './permitted-appolication.service';
import { RestApiService } from './rest-api.service';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private _loggedInUserDataBehavior = new BehaviorSubject<
    UserProfile | undefined
  >(undefined);
  public loggedInUserData$ = this._loggedInUserDataBehavior.asObservable();

  constructor(
    private permittedApplicationService: PermittedApplicationService,
    private restApiService: RestApiService
  ) {}

  publishLoggedInUserData(userData: UserProfile | undefined) {
    this._loggedInUserDataBehavior.next(userData);
  }

  updateLoggedInUserData(userData?: Partial<UserProfile>) {
    
    const updatedData = userData as any;
    const existingData = this.getLoggedInUserDetails() as any;
    
    const updatedKeys = Object.keys(updatedData) || [];
    if(updatedKeys?.length){
      for(const key of updatedKeys){
        if(updatedData[key] !== undefined){
          existingData[key] = updatedData[key];
        }
      }
      this.publishLoggedInUserData(existingData);
    }
  }

  clearLoggedInUserData() {
    this._loggedInUserDataBehavior.next(undefined);
  }

  getLoggedInUserDetails() {
    return this._loggedInUserDataBehavior.getValue();
  }

  getLoggedInUserPermissions() {
    return this.getLoggedInUserDetails()?.permissions;
  }


  getSystemUser() {
    return JSON.parse(atob(environment.systemUserDetails || '') || '');
  }

  getUserInfoForTracking(){
    return {
      email: this.getLoggedInUserDetails()?.email,
      id: this.getLoggedInUserDetails()?.id
    }
  }

  getAppConfig(slug: string){
    const userDetails = this.getLoggedInUserDetails();
    const appId = this.permittedApplicationService.getApplicationIdBySlug(slug);
    return userDetails?.config?.[`${appId}`] || null;
  }

  updateAppConfig(req: {
    appSlug: string,
    config: any,
    dbSync?: boolean 
  }){
    const userDetails = this.getLoggedInUserDetails();
    if(userDetails){
      const appId = this.permittedApplicationService.getApplicationIdBySlug(req.appSlug);
      if(!userDetails?.config){
        userDetails.config = {}
      }
      userDetails.config[`${appId}`] = req.config;
      this.updateLoggedInUserData({
        config: userDetails.config
      });

      if(req.dbSync){
        this.restApiService.postRequest({
          path: `xapps-admin/user-profile/update-config`,
          body: {
            config: userDetails.config
          },
          headers: {
            'x-user-info': JSON.stringify(this.getUserInfoForTracking())
          }
        });
      }
    }
  }
}
