/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface ApiGetSchedulerDetailsApplicationNameGet$Params {
  client_id?: string;
  client_secret?: string;
  'Content-Type'?: string;
  email?: string;
  applicationName: string;
}

export function apiGetSchedulerDetailsApplicationNameGet(http: HttpClient, rootUrl: string, params: ApiGetSchedulerDetailsApplicationNameGet$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
  const rb = new RequestBuilder(rootUrl, apiGetSchedulerDetailsApplicationNameGet.PATH, 'get');
  if (params) {
    rb.header('client_id', params.client_id, {});
    rb.header('client_secret', params.client_secret, {});
    rb.header('Content-Type', params['Content-Type'], {});
    rb.header('email', params.email, {});
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

apiGetSchedulerDetailsApplicationNameGet.PATH = '/api/getSchedulerDetails/{applicationName}';
