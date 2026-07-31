import type { MeResponse } from '@festivapp/contracts';
import { assert } from '@festivapp/utils';
import {
  createServer,
  request,
  type RequestOptions as HttpRequestOptions,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type Server,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach } from 'node:test';

import { createApp } from '../../src/app.ts';
import { config } from '../../src/config.ts';
import { closeDatabase, resetDatabase } from './database.ts';

type RequestOptions = {
  host?: string;
  headers?: Record<string, string>;
};

export type ApiResponse<T> = {
  status: number;
  headers: IncomingHttpHeaders;
  body: T;
};

export function useApi(): TestApi {
  const api = new TestApi();

  before(() => api.start());
  beforeEach(() => resetDatabase());

  after(async () => {
    await api.stop();
    await closeDatabase();
  });

  return api;
}

export class TestApi {
  private server: Server = createServer(createApp());
  private cookies = new Map<string, string>();
  private port = 0;

  async start(): Promise<void> {
    if (config.databaseUrl !== undefined) {
      assert(config.databaseUrl.includes('localhost'), new Error('DATABASE_URL must include "localhost"'));
    }

    await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve));

    const address = this.server.address() as AddressInfo | null;
    assert(address);

    this.port = address.port;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('POST', path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('PATCH', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('PUT', path, body, options);
  }

  delete<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('DELETE', path, body, options);
  }

  login(email: string, password: string) {
    return this.post<MeResponse>('/admin/auth/login', { email, password });
  }

  clearCookies(): void {
    this.cookies.clear();
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { data, headers: bodyHeaders } = serializeBody(body);

    const response = await send(
      {
        host: '127.0.0.1',
        port: this.port,
        method,
        path,
        headers: {
          host: options.host ?? 'localhost',
          ...this.cookieHeaders,
          ...bodyHeaders,
          ...options.headers,
        },
      },
      data,
    );

    this.storeCookies(response);

    return {
      status: response.statusCode ?? 0,
      headers: response.headers,
      body: readBody(response) as T,
    };
  }

  private get cookieHeaders() {
    if (this.cookies.size === 0) {
      return {};
    }

    const cookie = Array.from(this.cookies, ([name, value]) => `${name}=${encodeURIComponent(value)}`).join('; ');

    return {
      cookie,
    };
  }

  private storeCookies(response: IncomingMessage) {
    for (const cookie of response.headers['set-cookie'] ?? []) {
      const [pair = ''] = cookie.split(';');
      const splitAt = pair.indexOf('=');

      if (splitAt === -1) {
        continue;
      }

      const name = pair.slice(0, splitAt).trim();
      const value = decodeURIComponent(pair.slice(splitAt + 1).trim());

      if (value === '') {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }
}

function send(options: HttpRequestOptions, data?: Buffer) {
  return new Promise<IncomingMessage & { data: Buffer }>((resolve, reject) => {
    const req = request(options, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => resolve(Object.assign(res, { data: Buffer.concat(chunks) })));
    });

    req.on('error', reject);
    req.end(data);
  });
}

function serializeBody(body: unknown) {
  if (body === undefined) {
    return {};
  }

  if (Buffer.isBuffer(body)) {
    return {
      data: body,
      headers: {
        'content-type': 'application/octet-stream',
        'content-length': String(body.length),
      },
    };
  }

  const data = Buffer.from(JSON.stringify(body));

  return {
    data,
    headers: {
      'content-type': 'application/json',
      'content-length': String(data.length),
    },
  };
}

function readBody(response: IncomingMessage & { data: Buffer }) {
  const contentType = response.headers['content-type'] ?? '';

  if (response.data.length === 0) {
    return undefined;
  }

  if (contentType.includes('json')) {
    return JSON.parse(response.data.toString());
  }

  return response.data;
}
