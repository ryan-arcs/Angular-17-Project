/* tslint:disable */
/* eslint-disable */
import { Injectable } from '@angular/core';

/**
 * Global configuration
 */
@Injectable({
  providedIn: 'root',
})
export class ApiConfiguration {
  rootUrl: string = 'https://p7rpmqnq8j.execute-api.us-east-1.amazonaws.com/prod/mulesoft-api';
}

/**
 * Parameters for `ApiModule.forRoot()`
 */
export interface ApiConfigurationParams {
  rootUrl?: string;
}
