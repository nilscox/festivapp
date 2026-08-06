import type { PGlite } from '@electric-sql/pglite';
import type { MeResponse } from '@festivapp/contracts';
import { assert, defined } from '@festivapp/utils';
import { getTableName, is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import {
  createServer,
  request,
  Server,
  type RequestOptions as HttpRequestOptions,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type RequestListener,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, type TestContext } from 'node:test';

import { createApp } from '../../src/app.ts';
import { type Config } from '../../src/config.ts';
import { closeDatabase, createDatabase, type Database } from '../../src/db/client.ts';
import * as schema from '../../src/db/schema.ts';
import { createPush, type Push } from '../../src/push.ts';
import { createStorage, type Storage } from '../../src/storage.ts';
import { testConfig } from './config.ts';
import { StubLogger } from './logger.ts';
import { createFileClient } from './template.ts';

export type TestDependencies = {
  config?: Partial<Config>;
  storage?: Storage;
  push?: Push;
};

type RequestOptions = {
  host?: string;
  headers?: Record<string, string>;
};

export type ApiResponse<T> = {
  status: number;
  headers: IncomingHttpHeaders;
  body: T;
};

export class TestSuite {
  public readonly db: Database;

  private client: PGlite;
  private server: Server;
  private handler?: RequestListener;
  private port = 0;

  static create(): TestSuite {
    const suite = new TestSuite();

    before(() => suite.start());
    after(() => suite.stop());

    beforeEach(() => suite.clear());

    return suite;
  }

  private constructor() {
    const config = testConfig();

    this.client = createFileClient();

    this.db = createDatabase({
      config,
      logger: new StubLogger(config.logLevel),
      client: this.client,
    });

    this.server = createServer((req, res) => defined(this.handler)(req, res));
  }

  api(t: TestContext, dependencies: TestDependencies = {}): TestApi {
    const config = testConfig(dependencies.config);
    const logger = new StubLogger(config.logLevel);
    const storage = dependencies.storage ?? createStorage({ config });
    const push = dependencies.push ?? createPush({ config, logger, db: this.db });

    this.handler = createApp({ config, logger, db: this.db, storage, push });

    t.after(() => {
      if (!t.passed) {
        logger.dump((message) => t.diagnostic(message));
      }
    });

    return new TestApi({ config, logger, storage, push, port: this.port });
  }

  private async start(): Promise<void> {
    await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve));

    const address = this.server.address() as AddressInfo | null;
    assert(address);

    this.port = address.port;
  }

  private async stop(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server.close((err) => (err ? reject(err) : resolve()));
    });

    await closeDatabase(this.db);
  }

  private async clear(): Promise<void> {
    const query = Object.values(schema)
      .filter((value) => is(value, PgTable))
      .map((table) => `delete from "${getTableName(table)}"`)
      .join('; ');

    await this.client.exec(query);
  }
}

export class TestApi {
  public readonly config: Config;
  public readonly logger: StubLogger;
  public readonly storage: Storage;
  public readonly push: Push;

  private port: number;
  private cookies = new Map<string, string>();

  constructor({
    config,
    logger,
    storage,
    push,
    port,
  }: {
    config: Config;
    logger: StubLogger;
    storage: Storage;
    push: Push;
    port: number;
  }) {
    this.config = config;
    this.logger = logger;
    this.storage = storage;
    this.push = push;
    this.port = port;
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
