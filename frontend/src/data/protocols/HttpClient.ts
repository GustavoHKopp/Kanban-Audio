export interface HttpResponse<T> {
  statusCode: number;
  body: T;
}

export interface HttpClient {
  get<T>(url: string): Promise<HttpResponse<T>>;
  post<T>(url: string, body: unknown): Promise<HttpResponse<T>>;
  patch<T>(url: string, body: unknown): Promise<HttpResponse<T>>;
  delete<T>(url: string): Promise<HttpResponse<T>>;
}
