import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { RestApiDeleteCallRequest, RestApiGetCallRequest, RestApiPostCallRequest, RestApiPutCallRequest, RestApiReponseOptions } from "@app/my-apps/asher/interfaces/global.interface";
import { del, get, post, put } from "aws-amplify/api";
import axios, { AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class RestApiService {
  private baseUrl = "http://localhost:3000/";

  constructor(private http: HttpClient) {}
  
  async getRequest(request: RestApiGetCallRequest) {
    const httpParams = this.buildHttpParams(request.queryParams);
    const httpHeaders = this.buildHttpHeaders(request.headers);

    let httpResponse: any;
    if (request.responseType === 'blob') {
        httpResponse = await firstValueFrom(
            this.http.get(
                `${this.baseUrl}${request.path}`,
                {
                    headers: httpHeaders,
                    params: httpParams,
                    responseType: 'blob',
                    observe: 'response'
                }
            )
        );
    } else {
        httpResponse = await firstValueFrom(
            this.http.get(
                `${this.baseUrl}${request.path}`,
                {
                    headers: httpHeaders,
                    params: httpParams,
                    observe: 'response'
                }
            )
        );
    }

    return this.response({
      httpResponse,
      type: 'get',
      responseType: request.responseType
    });
  }

  async postRequest(request: RestApiPostCallRequest) {
    const httpParams = this.buildHttpParams(request.queryParams);
    const httpHeaders = this.buildHttpHeaders(request.headers);

    let httpResponse: any;
    if (request.responseType === 'blob') {
        httpResponse = await firstValueFrom(
            this.http.post(
                `${this.baseUrl}${request.path}`,
                request.body,
                {
                    headers: httpHeaders,
                    params: httpParams,
                    responseType: 'blob',
                    observe: 'response'
                }
            )
        );
    } else {
        httpResponse = await firstValueFrom(
            this.http.post(
                `${this.baseUrl}${request.path}`,
                request.body,
                {
                    headers: httpHeaders,
                    params: httpParams,
                    observe: 'response'
                }
            )
        );
    }
    return this.response({
      httpResponse,
      type: 'post',
      responseType: request.responseType
    });
  }

  async putRequest(request: RestApiPutCallRequest) {
    const httpParams = this.buildHttpParams(request.queryParams);
    const httpHeaders = this.buildHttpHeaders(request.headers);

    let httpResponse: any;
    if (request.responseType === 'blob') {
        httpResponse = await firstValueFrom(
            this.http.put(
                `${this.baseUrl}${request.path}`,
                request.body,
                {
                    headers: httpHeaders,
                    params: httpParams,
                    responseType: 'blob',
                    observe: 'response'
                }
            )
        );
    } else {
        httpResponse = await firstValueFrom(
            this.http.put(
                `${this.baseUrl}${request.path}`,
                request.body,
                {
                    headers: httpHeaders,
                    params: httpParams,
                    observe: 'response'
                }
            )
        );
    }

    return this.response({
      httpResponse,
      type: 'put',
      responseType: request.responseType
    });
  }

  async deleteRequest(request: RestApiDeleteCallRequest) {
    const httpParams = this.buildHttpParams(request.queryParams);
    const httpHeaders = this.buildHttpHeaders(request.headers);
    
    const httpResponse = await firstValueFrom(
      this.http.delete(
        `${this.baseUrl}${request.path}`,
        {
          headers: httpHeaders,
          params: httpParams,
          observe: 'response'
        }
      )
    );

    return this.response({
      httpResponse,
      type: 'del',
      responseType: request.responseType
    });
  }

  private buildHttpParams(queryParams?: any): HttpParams {
    let httpParams = new HttpParams();
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== null && queryParams[key] !== undefined) {
          httpParams = httpParams.set(key, queryParams[key]);
        }
      });
    }
    return httpParams;
  }

  private buildHttpHeaders(headers?: any): HttpHeaders {
    let httpHeaders = new HttpHeaders();
    if (headers) {
      Object.keys(headers).forEach(key => {
        if (headers[key] !== null && headers[key] !== undefined) {
          httpHeaders = httpHeaders.set(key, headers[key]);
        }
      });
    }
    return httpHeaders;
  }

  private async response(options: any) {
    const response: HttpResponse<any> = options.httpResponse;
    if (options.type === 'del') {
      return response.status;
    }

    switch (options.responseType) {
      case 'text':
        return response.body as string;
      case 'blob':
        return response.body as Blob;
      default:
        return response.body; // JSON
    }
  }
}


