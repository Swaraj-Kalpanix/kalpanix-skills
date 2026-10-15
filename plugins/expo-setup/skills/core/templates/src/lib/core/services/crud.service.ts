import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as z from 'zod';

import { ApiError } from '../errors/api.error';
import type { ListQueryBuilder } from '../query/listQuery.types';
import { NestCrudQueryBuilder } from '../query/nestCrudQuery.builder';
import type { Id, ListParams, PaginatedResponse } from '../types/api.types';
import { withQuery } from '../utils/queryString';
import { validateResponse } from '../validation/validateResponse';
import { BaseService } from './base.service';

export interface CrudServiceOptions<T, TFilters> {
  /** Resource path, e.g. `/leads`. The only place the endpoint is written. */
  endpoint: string;
  /** How lists are queried. Default: `new NestCrudQueryBuilder()`. Use `RestQueryBuilder` for plain REST. */
  query?: ListQueryBuilder<TFilters>;
  /** Entity schema — validates every record the API (or mock) returns. */
  schema?: z.ZodType<T>;
  /** Default: the authenticated `http` client. */
  client?: AxiosInstance;
}

type RequestConfig = Pick<AxiosRequestConfig, 'signal' | 'headers' | 'timeout'>;

/**
 * Standard CRUD over one endpoint: `list`, `getById`, `create`, `update`
 * (PATCH), `replace` (PUT), `remove`.
 *
 * ```ts
 * export const leadService = new CrudService<Lead, LeadFilters, CreateLeadDto>({
 *   endpoint: '/leads',
 *   schema: LeadSchema,
 *   query: new NestCrudQueryBuilder<LeadFilters>({ searchFields: ['name', 'email'] }),
 * });
 * ```
 * Subclass to add endpoint-specific methods (`this.post(...)` etc. are available).
 */
export class CrudService<T, TFilters = unknown, TCreate = Partial<T>, TUpdate = Partial<TCreate>> extends BaseService {
  readonly endpoint: string;
  protected readonly query: ListQueryBuilder<TFilters>;
  protected readonly schema?: z.ZodType<T>;
  private listSchema?: z.ZodType<T[]>;

  constructor({ endpoint, query, schema, client }: CrudServiceOptions<T, TFilters>) {
    super(client);
    this.endpoint = endpoint.replace(/\/+$/, '');
    this.query = query ?? new NestCrudQueryBuilder<TFilters>();
    this.schema = schema;
  }

  async list(params: ListParams<TFilters> = {}, config?: RequestConfig): Promise<PaginatedResponse<T>> {
    const url = withQuery(this.endpoint, this.query.build(params));
    const raw = await this.get<unknown>(url, config);

    let page: PaginatedResponse<T>;
    try {
      page = this.query.parseList<T>(raw, params);
    } catch (error) {
      throw new ApiError(error instanceof Error ? error.message : 'Unexpected list response.', {
        code: 'VALIDATION',
        data: raw,
      });
    }

    if (this.schema) {
      this.listSchema ??= z.array(this.schema);
      page = { ...page, data: validateResponse(this.listSchema, page.data, `GET ${this.endpoint}`) };
    }
    return page;
  }

  getById(id: Id, config?: RequestConfig): Promise<T> {
    return this.get<T>(this.itemUrl(id), { ...config, schema: this.schema });
  }

  create(payload: TCreate, config?: RequestConfig): Promise<T> {
    return this.post<T>(this.endpoint, payload, { ...config, schema: this.schema });
  }

  update(id: Id, payload: TUpdate, config?: RequestConfig): Promise<T> {
    return this.patch<T>(this.itemUrl(id), payload, { ...config, schema: this.schema });
  }

  replace(id: Id, payload: TCreate, config?: RequestConfig): Promise<T> {
    return this.put<T>(this.itemUrl(id), payload, { ...config, schema: this.schema });
  }

  remove(id: Id, config?: RequestConfig): Promise<void> {
    return this.delete<void>(this.itemUrl(id), config);
  }

  protected itemUrl(id: Id): string {
    return `${this.endpoint}/${encodeURIComponent(String(id))}`;
  }
}
