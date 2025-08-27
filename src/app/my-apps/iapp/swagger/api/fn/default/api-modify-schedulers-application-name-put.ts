/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface ApiModifySchedulersApplicationNamePut$Params {
  client_id?: string;
  client_secret?: string;
  'Content-Type'?: string;
  email?: string;
  applicationName: string;
      body?: {
}
}

export function apiModifySchedulersApplicationNamePut(http: HttpClient, rootUrl: string, params: ApiModifySchedulersApplicationNamePut$Params, context?: HttpContext): Observable<StrictHttpResponse<any>> {
  const rb = new RequestBuilder(rootUrl, apiModifySchedulersApplicationNamePut.PATH, 'put');
  if (params) {
    rb.header('client_id', params.client_id, {});
    rb.header('client_secret', params.client_secret, {});
    rb.header('Content-Type', params['Content-Type'], {});
    rb.header('email', params.email, {});
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

apiModifySchedulersApplicationNamePut.PATH = '/api/modifySchedulers/{applicationName}';
