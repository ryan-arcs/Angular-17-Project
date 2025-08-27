import { Injectable } from "@angular/core";
import { RestApiDeleteCallRequest, RestApiGetCallRequest, RestApiPostCallRequest, RestApiPutCallRequest, RestApiReponseOptions } from "@app/my-apps/asher/interfaces/global.interface";
import { del, get, post, put } from "aws-amplify/api";
import axios, { AxiosResponse } from "axios";

@Injectable({
  providedIn: 'root',
})
export class RestApiService {
  private baseUrl = "http://localhost:3000/";

  async getRequest(request: RestApiGetCallRequest) {
    const axiosResponse = await axios.get(
      `${this.baseUrl}${request.path}`,
      {
        headers: request.headers,
        params: request.queryParams,
        responseType: request.responseType === 'blob' ? 'blob' : 'json'
      }
    );

    return this.response({
      axiosResponse,
      type: 'get',
      responseType: request.responseType
    });
  }

  async postRequest(request: RestApiPostCallRequest) {
    const axiosResponse = await axios.post(
      `${this.baseUrl}${request.path}`,
      request.body,
      {
        headers: request.headers,
        params: request.queryParams,
        responseType: request.responseType === 'blob' ? 'blob' : 'json'
      }
    );
    return this.response({
      axiosResponse,
      type: 'post',
      responseType: request.responseType
    });
  }

  async putRequest(request: RestApiPutCallRequest) {
    const axiosResponse = await axios.put(
      `${this.baseUrl}${request.path}`,
      request.body,
      {
        headers: request.headers,
        params: request.queryParams,
        responseType: request.responseType === 'blob' ? 'blob' : 'json'
      }
    );

    return this.response({
      axiosResponse,
      type: 'put',
      responseType: request.responseType
    });
  }

  async deleteRequest(request: RestApiDeleteCallRequest) {
    const axiosResponse = await axios.delete(
      `${this.baseUrl}${request.path}`,
      {
        headers: request.headers,
        params: request.queryParams,
      }
    );

    return this.response({
      axiosResponse,
      type: 'del',
      responseType: request.responseType
    });
  }

  private async response(options: any) {
    const response: AxiosResponse = options.axiosResponse;
    if (options.type === 'del') {
      return response.status;
    }

    switch (options.responseType) {
      case 'text':
        return response.data as string;
      case 'blob':
        return response.data as Blob;
      default:
        return response.data; // JSON
    }
  }
}


