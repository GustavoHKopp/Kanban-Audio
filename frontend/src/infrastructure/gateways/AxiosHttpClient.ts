import axios, { AxiosInstance } from "axios";
import { HttpClient, HttpResponse } from "../../data/protocols/HttpClient";

export class AxiosHttpClient implements HttpClient {
  private readonly instance: AxiosInstance;

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      validateStatus: () => true,
    });
  }

  async get<T>(url: string): Promise<HttpResponse<T>> {
    const resposta = await this.instance.get<T>(url);
    return { statusCode: resposta.status, body: resposta.data };
  }

  async post<T>(url: string, body: unknown): Promise<HttpResponse<T>> {
    const resposta = await this.instance.post<T>(url, body);
    return { statusCode: resposta.status, body: resposta.data };
  }

  async patch<T>(url: string, body: unknown): Promise<HttpResponse<T>> {
    const resposta = await this.instance.patch<T>(url, body);
    return { statusCode: resposta.status, body: resposta.data };
  }

  async delete<T>(url: string): Promise<HttpResponse<T>> {
    const resposta = await this.instance.delete<T>(url);
    return { statusCode: resposta.status, body: resposta.data };
  }
}
