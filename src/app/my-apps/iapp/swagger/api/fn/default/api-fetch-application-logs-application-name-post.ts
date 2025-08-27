/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface ApiFetchApplicationLogsApplicationNamePost$Params {
  client_id?: string;
  client_secret?: string;
  'Content-Type'?: string;
  email?: string;
  advanceSearch?: boolean;
  offset?: number;
  applicationName: string;
      body: {

/**
 * The limit value
 */
'limit'?: number;

/**
 * Instance id of a deployment
 */
'instanceId'?: string;

/**
 * Search parameter
 */
'searchText'?: string;

/**
 * Start time
 */
'startTime'?: number;

/**
 * End time
 */
'endTime'?: number;

/**
 * Priority
 */
'priority'?: string;

/**
 * Lower Id
 */
'lowerId'?: string;
}
}

export function apiFetchApplicationLogsApplicationNamePost(http: HttpClient, rootUrl: string, params: ApiFetchApplicationLogsApplicationNamePost$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
  const rb = new RequestBuilder(rootUrl, apiFetchApplicationLogsApplicationNamePost.PATH, 'post');
  if (params) {
    rb.header('client_id', params.client_id, {});
    rb.header('client_secret', params.client_secret, {});
    rb.header('Content-Type', params['Content-Type'], {});
    rb.header('email', params.email, {});
    rb.query('advanceSearch', params.advanceSearch, {});
    rb.query('offset', params.offset, {});
    rb.path('applicationName', params.applicationName, {});
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<any>;
    })
  );
}

apiFetchApplicationLogsApplicationNamePost.PATH = '/api/fetchApplicationLogs/{applicationName}';
