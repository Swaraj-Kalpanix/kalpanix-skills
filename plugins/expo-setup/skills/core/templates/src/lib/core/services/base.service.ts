import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type * as z from 'zod';

import { toApiError } from '../errors/api.error';
import { http } from '../http/client';
import { validateResponse } from '../validation/validateResponse';

export interface ServiceRequestConfig<T = unknown> extends AxiosRequestConfig {
  /** Validate (and parse) the response body. The return type is inferred from it. */
  schema?: z.ZodType<T>;
}

/**
 * Base for every service. Methods return the response body and always throw
 * `ApiError` — never raw axios errors.
 *
 * ```ts
 * class AuthService extends BaseService {
 *   constructor() { super(publicHttp); }
 *   login(dto: LoginDto) {
 *     return this.post('/auth/login', dto, { schema: SessionSchema });
 *   }
 * }
 * export const authService = new AuthService();
 * ```
 *
 * Export one instance per service (`export const leadService = new LeadService()`);
 * no `getInstance()` needed.
 */
export abstract class BaseService {
  protected readonly client: AxiosInstance;

  constructor(client: AxiosInstance = http) {
    this.client = client;
  }

  protected get<T = unknown>(url: string, config?: ServiceRequestConfig<T>): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  protected post<T = unknown>(url: string, body?: unknown, config?: ServiceRequestConfig<T>): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data: body });
  }

  protected patch<T = unknown>(url: string, body?: unknown, config?: ServiceRequestConfig<T>): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data: body });
  }

  protected put<T = unknown>(url: string, body?: unknown, config?: ServiceRequestConfig<T>): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data: body });
  }

  protected delete<T = void>(url: string, config?: ServiceRequestConfig<T>): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  protected async request<T>({ schema, ...config }: ServiceRequestConfig<T>): Promise<T> {
    let data: unknown;
    try {
      data = (await this.client.request(config)).data;
    } catch (error) {
      throw toApiError(error);
    }
    return schema ? validateResponse(schema, data, `${config.method} ${config.url}`) : (data as T);
  }
}
