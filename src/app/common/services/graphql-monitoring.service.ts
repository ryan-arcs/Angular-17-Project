import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class GraphqlMonitoringService {
  constructor(
    private toastService: ToastService
  ) {}

  initiate(){
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => { 
      const response = await originalFetch(input, init);
      if((response?.status === 400 || response?.status === 403) && response?.url?.includes('https://cognito-identity.us-east-1.amazonaws.com')){
        this.toastService.updateToastConfig({
          ingnoreIncomingToasts: true
        });
        window.location.reload();
      }
      return response;
    };
  }
}