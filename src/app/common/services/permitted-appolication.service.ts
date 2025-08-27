import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  PermittedApplication
} from '../interfaces/global.interface';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class PermittedApplicationService {
  // BehaviorSubject to hold the list of permitted applications.
    // Initialized with an empty array and exposed as an observable for components to subscribe.
    private _permittedApplications = new BehaviorSubject<
      Array<PermittedApplication> | null
    >(null);
   
    // Public observable for permitted applications, used by components to reactively get updates.
    public permittedApplications$ = this._permittedApplications.asObservable();
   
    // BehaviorSubject to hold the currently selected sub-application (or null if none selected).
    private selectedSubApplication = new BehaviorSubject<PermittedApplication | null>(null);
   
    // Public observable for selected sub-application, allows other components to reactively listen to changes.
    public selectedSubApplication$ = this.selectedSubApplication.asObservable();

  constructor(
    private localStorage: LocalStorageService,
  ) {}

  setPermittedApplications(permittedApplications: PermittedApplication[]){
    this._permittedApplications.next(permittedApplications);
  }

  clearPermittedApplications() {
    this._permittedApplications.next(null);
  }

  getPermittedApplications() {
    return this._permittedApplications.getValue() || [];
  }

  // Returns the application name corresponding to the provided slug.
    getApplicationNameBySlug(slug: string) {
      return (
        this._permittedApplications.getValue()?.find((app) => app.slug === slug)
          ?.name || ''
      );
    }
  
    // Returns the application id corresponding to the provided slug.
    getApplicationIdBySlug(slug: string) {
      return (
        this._permittedApplications.getValue()?.find((app) => app.slug === slug)
          ?.id
      );
    }
   
    // Returns the application object matching the provided slug.
    getApplicationBySlug(slug: string) {
      return (
        this._permittedApplications.getValue()?.find((app) => app.slug === slug)
      );
    }
   
    // Retrieves the list of all permitted subapplications.
    getSubapplications() {
      return (
        this._permittedApplications.getValue() || []
      );
    }
   
    // Sets the selected subapplication based on the provided code.
    setSubApplication(code: string) {
      const appConfig: any = this.localStorage.getLocalStorage();
      const applicationInformation = this.getApplicationBySlug(code) || null;
      const updatedConfig = applicationInformation ? { ...applicationInformation, appConfig } : appConfig;
      this.selectedSubApplication.next(updatedConfig || null);
    }
   
    // Clears the currently selected subapplication.
    removeApplicationName() {
      this.selectedSubApplication.next(null);
    }
  
}
