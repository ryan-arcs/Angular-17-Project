/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { apiFetchApplicationLogsApplicationNamePost } from '../fn/default/api-fetch-application-logs-application-name-post';
import { ApiFetchApplicationLogsApplicationNamePost$Params } from '../fn/default/api-fetch-application-logs-application-name-post';
import { apiGetAllApplicationDetailsGet } from '../fn/default/api-get-all-application-details-get';
import { ApiGetAllApplicationDetailsGet$Params } from '../fn/default/api-get-all-application-details-get';
import { apiGetApplicationDeploymentIdsApplicationNameGet } from '../fn/default/api-get-application-deployment-ids-application-name-get';
import { ApiGetApplicationDeploymentIdsApplicationNameGet$Params } from '../fn/default/api-get-application-deployment-ids-application-name-get';
import { apiGetApplicationLogsApplicationNameGet } from '../fn/default/api-get-application-logs-application-name-get';
import { ApiGetApplicationLogsApplicationNameGet$Params } from '../fn/default/api-get-application-logs-application-name-get';
import { apiGetDashboardChartsApplicationNameGet } from '../fn/default/api-get-dashboard-charts-application-name-get';
import { ApiGetDashboardChartsApplicationNameGet$Params } from '../fn/default/api-get-dashboard-charts-application-name-get';
import { apiGetDashboardDetailsApplicationNameGet } from '../fn/default/api-get-dashboard-details-application-name-get';
import { ApiGetDashboardDetailsApplicationNameGet$Params } from '../fn/default/api-get-dashboard-details-application-name-get';
import { apiGetDashboardGridApplicationNameGet } from '../fn/default/api-get-dashboard-grid-application-name-get';
import { ApiGetDashboardGridApplicationNameGet$Params } from '../fn/default/api-get-dashboard-grid-application-name-get';
import { apiGetLogsByInstanceIdApplicationNameGet } from '../fn/default/api-get-logs-by-instance-id-application-name-get';
import { ApiGetLogsByInstanceIdApplicationNameGet$Params } from '../fn/default/api-get-logs-by-instance-id-application-name-get';
import { apiGetLogsFileApplicationNameGet } from '../fn/default/api-get-logs-file-application-name-get';
import { ApiGetLogsFileApplicationNameGet$Params } from '../fn/default/api-get-logs-file-application-name-get';
import { apiGetSchedulerDetailsApplicationNameGet } from '../fn/default/api-get-scheduler-details-application-name-get';
import { ApiGetSchedulerDetailsApplicationNameGet$Params } from '../fn/default/api-get-scheduler-details-application-name-get';
import { apiHealthCheckGet } from '../fn/default/api-health-check-get';
import { ApiHealthCheckGet$Params } from '../fn/default/api-health-check-get';
import { apiModifySchedulersApplicationNamePut } from '../fn/default/api-modify-schedulers-application-name-put';
import { ApiModifySchedulersApplicationNamePut$Params } from '../fn/default/api-modify-schedulers-application-name-put';
import { apiModifySchedulersByJobIdApplicationNameSchedulerJobIdPut } from '../fn/default/api-modify-schedulers-by-job-id-application-name-scheduler-job-id-put';
import { ApiModifySchedulersByJobIdApplicationNameSchedulerJobIdPut$Params } from '../fn/default/api-modify-schedulers-by-job-id-application-name-scheduler-job-id-put';
import { apiRestartApplicationApplicationNamePost } from '../fn/default/api-restart-application-application-name-post';
import { ApiRestartApplicationApplicationNamePost$Params } from '../fn/default/api-restart-application-application-name-post';
import { apiStartApplicationApplicationNamePost } from '../fn/default/api-start-application-application-name-post';
import { ApiStartApplicationApplicationNamePost$Params } from '../fn/default/api-start-application-application-name-post';
import { apiStopApplicationApplicationNamePost } from '../fn/default/api-stop-application-application-name-post';
import { ApiStopApplicationApplicationNamePost$Params } from '../fn/default/api-stop-application-application-name-post';

@Injectable({ providedIn: 'root' })
export class DefaultService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `apiHealthCheckGet()` */
  static readonly ApiHealthCheckGetPath = '/api/healthCheck';

  /**
   * healthcheck API.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiHealthCheckGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiHealthCheckGet$Response(params?: ApiHealthCheckGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiHealthCheckGet(this.http, this.rootUrl, params, context);
  }

  /**
   * healthcheck API.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiHealthCheckGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiHealthCheckGet(params?: ApiHealthCheckGet$Params, context?: HttpContext): Observable<any> {
    return this.apiHealthCheckGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiGetAllApplicationDetailsGet()` */
  static readonly ApiGetAllApplicationDetailsGetPath = '/api/getAllApplicationDetails';

  /**
   * Get Application Details.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiGetAllApplicationDetailsGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetAllApplicationDetailsGet$Response(params?: ApiGetAllApplicationDetailsGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiGetAllApplicationDetailsGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get Application Details.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiGetAllApplicationDetailsGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetAllApplicationDetailsGet(params?: ApiGetAllApplicationDetailsGet$Params, context?: HttpContext): Observable<any> {
    return this.apiGetAllApplicationDetailsGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiGetDashboardDetailsApplicationNameGet()` */
  static readonly ApiGetDashboardDetailsApplicationNameGetPath = '/api/getDashboardDetails/{applicationName}';

  /**
   * Get Dashboard Details.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiGetDashboardDetailsApplicationNameGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetDashboardDetailsApplicationNameGet$Response(params: ApiGetDashboardDetailsApplicationNameGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiGetDashboardDetailsApplicationNameGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get Dashboard Details.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiGetDashboardDetailsApplicationNameGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetDashboardDetailsApplicationNameGet(params: ApiGetDashboardDetailsApplicationNameGet$Params, context?: HttpContext): Observable<any> {
    return this.apiGetDashboardDetailsApplicationNameGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiGetDashboardChartsApplicationNameGet()` */
  static readonly ApiGetDashboardChartsApplicationNameGetPath = '/api/getDashboardCharts/{applicationName}';

  /**
   * Get Dashboard Charts.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiGetDashboardChartsApplicationNameGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetDashboardChartsApplicationNameGet$Response(params: ApiGetDashboardChartsApplicationNameGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiGetDashboardChartsApplicationNameGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get Dashboard Charts.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiGetDashboardChartsApplicationNameGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetDashboardChartsApplicationNameGet(params: ApiGetDashboardChartsApplicationNameGet$Params, context?: HttpContext): Observable<any> {
    return this.apiGetDashboardChartsApplicationNameGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiGetDashboardGridApplicationNameGet()` */
  static readonly ApiGetDashboardGridApplicationNameGetPath = '/api/getDashboardGrid/{applicationName}';

  /**
   * Get Dashboard Grid.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiGetDashboardGridApplicationNameGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetDashboardGridApplicationNameGet$Response(params: ApiGetDashboardGridApplicationNameGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiGetDashboardGridApplicationNameGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get Dashboard Grid.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiGetDashboardGridApplicationNameGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetDashboardGridApplicationNameGet(params: ApiGetDashboardGridApplicationNameGet$Params, context?: HttpContext): Observable<any> {
    return this.apiGetDashboardGridApplicationNameGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiGetApplicationDeploymentIdsApplicationNameGet()` */
  static readonly ApiGetApplicationDeploymentIdsApplicationNameGetPath = '/api/getApplicationDeploymentIds/{applicationName}';

  /**
   * Get Application Deployment Ids.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiGetApplicationDeploymentIdsApplicationNameGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetApplicationDeploymentIdsApplicationNameGet$Response(params: ApiGetApplicationDeploymentIdsApplicationNameGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiGetApplicationDeploymentIdsApplicationNameGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get Application Deployment Ids.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiGetApplicationDeploymentIdsApplicationNameGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetApplicationDeploymentIdsApplicationNameGet(params: ApiGetApplicationDeploymentIdsApplicationNameGet$Params, context?: HttpContext): Observable<any> {
    return this.apiGetApplicationDeploymentIdsApplicationNameGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiGetApplicationLogsApplicationNameGet()` */
  static readonly ApiGetApplicationLogsApplicationNameGetPath = '/api/getApplicationLogs/{applicationName}';

  /**
   * Get Application Logs.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiGetApplicationLogsApplicationNameGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetApplicationLogsApplicationNameGet$Response(params: ApiGetApplicationLogsApplicationNameGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiGetApplicationLogsApplicationNameGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get Application Logs.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiGetApplicationLogsApplicationNameGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetApplicationLogsApplicationNameGet(params: ApiGetApplicationLogsApplicationNameGet$Params, context?: HttpContext): Observable<any> {
    return this.apiGetApplicationLogsApplicationNameGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiGetLogsByInstanceIdApplicationNameGet()` */
  static readonly ApiGetLogsByInstanceIdApplicationNameGetPath = '/api/getLogsByInstanceId/{applicationName}';

  /**
   * Get Instance Logs.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiGetLogsByInstanceIdApplicationNameGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetLogsByInstanceIdApplicationNameGet$Response(params: ApiGetLogsByInstanceIdApplicationNameGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiGetLogsByInstanceIdApplicationNameGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get Instance Logs.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiGetLogsByInstanceIdApplicationNameGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetLogsByInstanceIdApplicationNameGet(params: ApiGetLogsByInstanceIdApplicationNameGet$Params, context?: HttpContext): Observable<any> {
    return this.apiGetLogsByInstanceIdApplicationNameGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiFetchApplicationLogsApplicationNamePost()` */
  static readonly ApiFetchApplicationLogsApplicationNamePostPath = '/api/fetchApplicationLogs/{applicationName}';

  /**
   * Fetch Application Logs.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiFetchApplicationLogsApplicationNamePost()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  apiFetchApplicationLogsApplicationNamePost$Response(params: ApiFetchApplicationLogsApplicationNamePost$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiFetchApplicationLogsApplicationNamePost(this.http, this.rootUrl, params, context);
  }

  /**
   * Fetch Application Logs.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiFetchApplicationLogsApplicationNamePost$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  apiFetchApplicationLogsApplicationNamePost(params: ApiFetchApplicationLogsApplicationNamePost$Params, context?: HttpContext): Observable<any> {
    return this.apiFetchApplicationLogsApplicationNamePost$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiGetLogsFileApplicationNameGet()` */
  static readonly ApiGetLogsFileApplicationNameGetPath = '/api/getLogsFile/{applicationName}';

  /**
   * Get Instance Logs.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiGetLogsFileApplicationNameGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetLogsFileApplicationNameGet$Response(params: ApiGetLogsFileApplicationNameGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiGetLogsFileApplicationNameGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get Instance Logs.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiGetLogsFileApplicationNameGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetLogsFileApplicationNameGet(params: ApiGetLogsFileApplicationNameGet$Params, context?: HttpContext): Observable<any> {
    return this.apiGetLogsFileApplicationNameGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiGetSchedulerDetailsApplicationNameGet()` */
  static readonly ApiGetSchedulerDetailsApplicationNameGetPath = '/api/getSchedulerDetails/{applicationName}';

  /**
   * Get Scheduler Details.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiGetSchedulerDetailsApplicationNameGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetSchedulerDetailsApplicationNameGet$Response(params: ApiGetSchedulerDetailsApplicationNameGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiGetSchedulerDetailsApplicationNameGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get Scheduler Details.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiGetSchedulerDetailsApplicationNameGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiGetSchedulerDetailsApplicationNameGet(params: ApiGetSchedulerDetailsApplicationNameGet$Params, context?: HttpContext): Observable<any> {
    return this.apiGetSchedulerDetailsApplicationNameGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiModifySchedulersByJobIdApplicationNameSchedulerJobIdPut()` */
  static readonly ApiModifySchedulersByJobIdApplicationNameSchedulerJobIdPutPath = '/api/modifySchedulersByJobId/{applicationName}/{schedulerJobId}';

  /**
   * Modify Scheduler by Job ID.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiModifySchedulersByJobIdApplicationNameSchedulerJobIdPut()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  apiModifySchedulersByJobIdApplicationNameSchedulerJobIdPut$Response(params: ApiModifySchedulersByJobIdApplicationNameSchedulerJobIdPut$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiModifySchedulersByJobIdApplicationNameSchedulerJobIdPut(this.http, this.rootUrl, params, context);
  }

  /**
   * Modify Scheduler by Job ID.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiModifySchedulersByJobIdApplicationNameSchedulerJobIdPut$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  apiModifySchedulersByJobIdApplicationNameSchedulerJobIdPut(params: ApiModifySchedulersByJobIdApplicationNameSchedulerJobIdPut$Params, context?: HttpContext): Observable<any> {
    return this.apiModifySchedulersByJobIdApplicationNameSchedulerJobIdPut$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiModifySchedulersApplicationNamePut()` */
  static readonly ApiModifySchedulersApplicationNamePutPath = '/api/modifySchedulers/{applicationName}';

  /**
   * Run Scheduler.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiModifySchedulersApplicationNamePut()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  apiModifySchedulersApplicationNamePut$Response(params: ApiModifySchedulersApplicationNamePut$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiModifySchedulersApplicationNamePut(this.http, this.rootUrl, params, context);
  }

  /**
   * Run Scheduler.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiModifySchedulersApplicationNamePut$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  apiModifySchedulersApplicationNamePut(params: ApiModifySchedulersApplicationNamePut$Params, context?: HttpContext): Observable<any> {
    return this.apiModifySchedulersApplicationNamePut$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiStartApplicationApplicationNamePost()` */
  static readonly ApiStartApplicationApplicationNamePostPath = '/api/startApplication/{applicationName}';

  /**
   * Start Application.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiStartApplicationApplicationNamePost()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiStartApplicationApplicationNamePost$Response(params: ApiStartApplicationApplicationNamePost$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiStartApplicationApplicationNamePost(this.http, this.rootUrl, params, context);
  }

  /**
   * Start Application.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiStartApplicationApplicationNamePost$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiStartApplicationApplicationNamePost(params: ApiStartApplicationApplicationNamePost$Params, context?: HttpContext): Observable<any> {
    return this.apiStartApplicationApplicationNamePost$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiRestartApplicationApplicationNamePost()` */
  static readonly ApiRestartApplicationApplicationNamePostPath = '/api/restartApplication/{applicationName}';

  /**
   * Restart Application.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiRestartApplicationApplicationNamePost()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiRestartApplicationApplicationNamePost$Response(params: ApiRestartApplicationApplicationNamePost$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiRestartApplicationApplicationNamePost(this.http, this.rootUrl, params, context);
  }

  /**
   * Restart Application.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiRestartApplicationApplicationNamePost$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiRestartApplicationApplicationNamePost(params: ApiRestartApplicationApplicationNamePost$Params, context?: HttpContext): Observable<any> {
    return this.apiRestartApplicationApplicationNamePost$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

  /** Path part for operation `apiStopApplicationApplicationNamePost()` */
  static readonly ApiStopApplicationApplicationNamePostPath = '/api/stopApplication/{applicationName}';

  /**
   * Stop Application.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `apiStopApplicationApplicationNamePost()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiStopApplicationApplicationNamePost$Response(params: ApiStopApplicationApplicationNamePost$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
    return apiStopApplicationApplicationNamePost(this.http, this.rootUrl, params, context);
  }

  /**
   * Stop Application.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `apiStopApplicationApplicationNamePost$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  apiStopApplicationApplicationNamePost(params: ApiStopApplicationApplicationNamePost$Params, context?: HttpContext): Observable<any> {
    return this.apiStopApplicationApplicationNamePost$Response(params, context).pipe(
      map((r: StrictHttpResponse<any>): any => r.body)
    );
  }

}
