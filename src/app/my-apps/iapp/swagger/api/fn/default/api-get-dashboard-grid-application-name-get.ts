/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface ApiGetDashboardGridApplicationNameGet$Params {
  client_id?: string;
  client_secret?: string;
  'Content-Type'?: string;
  email?: string;
  duration?: string;
  startIndex?: string;
  pageSize?: string;
  searchText?: string;
  isPayloadRequired?: boolean;
  sortColumn?: string;
  sortDirection?: string;
  columnFilters?: string;
  applicationName: string;
}

export function apiGetDashboardGridApplicationNameGet(http: HttpClient, rootUrl: string, params: ApiGetDashboardGridApplicationNameGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
  const rb = new RequestBuilder(rootUrl, apiGetDashboardGridApplicationNameGet.PATH, 'get');
  if (params) {
    rb.header('client_id', params.client_id, {});
    rb.header('client_secret', params.client_secret, {});
    rb.header('Content-Type', params['Content-Type'], {});
    rb.header('email', params.email, {});
    rb.query('duration', params.duration, {});
    rb.query('startIndex', params.startIndex, {});
    rb.query('pageSize', params.pageSize, {});
    rb.query('searchText', params.searchText, {});
    rb.query('isPayloadRequired', params.isPayloadRequired, {});
    rb.query('sortColumn', params.sortColumn, {});
    rb.query('sortDirection', params.sortDirection, {});
    rb.query('columnFilters', params.columnFilters, {});
    rb.path('applicationName', params.applicationName, {});
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

apiGetDashboardGridApplicationNameGet.PATH = '/api/getDashboardGrid/{applicationName}';
