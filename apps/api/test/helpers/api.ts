import type { MeResponse } from '@festivapp/contracts';
import { assert, defined } from '@festivapp/utils';
import { getTableName, is, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import {
  createServer,
  request,
  Server,
  type RequestOptions as HttpRequestOptions,
  type IncomingHttpHeaders,
  type IncomingMessage,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, afterEach, before, beforeEach, type SuiteContext, type TestContext } from 'node:test';
import { inspect } from 'node:util';

import { createApp } from '../../src/app.ts';
import { type Config } from '../../src/config.ts';
import { applyMigrations, closeDatabase, createDatabase, type Database } from '../../src/db/client.ts';
import * as schema from '../../src/db/schema.ts';
import { isLogLevel, type LogContext, type Logger, type LogLevel } from '../../src/logger.ts';
import { createPush, type Push } from '../../src/push.ts';
import { createStorage, type Storage } from '../../src/storage.ts';

type HookContext = TestContext | SuiteContext;

type RequestOptions = {
  host?: string;
  headers?: Record<string, string>;
};

export type ApiResponse<T> = {
  status: number;
  headers: IncomingHttpHeaders;
  body: T;
};

export class TestApi {
  static defaultConfig: Config = {
    env: 'test',
    host: '',
    port: NaN,
    logLevel: 'info',
    databaseUrl: process.env.DATABASE_URL,
    storageDir: undefined,
    uploadMaxBytes: undefined,
    vapidPublicKey: undefined,
    vapidPrivateKey: undefined,
    vapidSubject: '',
  };

  public readonly config: Config;
  public readonly logger: StubLogger;
  public readonly db: Database;
  public readonly storage: Storage;
  public readonly push: Push;

  private server: Server;
  private cookies = new Map<string, string>();
  private port = 0;

  static create(config: Partial<Config> = {}): TestApi {
    const api = new TestApi(config);

    before(() => api.start());
    after(() => api.stop());

    beforeEach(() => api.reset());
    afterEach((t) => api.logger.dump(t));

    return api;
  }

  private constructor(config: Partial<Config> = {}) {
    this.config = { ...TestApi.defaultConfig, ...config };

    if (this.config.databaseUrl !== undefined) {
      assert(this.config.databaseUrl.includes('localhost'), new Error('DATABASE_URL must include "localhost"'));
    }

    const logger = new StubLogger(this.config.logLevel);
    const db = createDatabase({ config: this.config, logger });
    const storage = createStorage({ config: this.config });
    const push = createPush({ config: this.config, logger, db });

    this.logger = logger;
    this.db = db;
    this.storage = storage;
    this.push = push;

    this.server = createServer(createApp({ config: this.config, logger, db, storage, push }));
  }

  async start(): Promise<void> {
    await applyMigrations(this.db);

    await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve));

    const address = this.server.address() as AddressInfo | null;
    assert(address);

    this.port = address.port;
  }

  async stop(): Promise<void> {
    const server = defined(this.server);

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });

    await closeDatabase(this.db);
  }

  async reset() {
    const tables = Object.values(schema).filter((value) => is(value, PgTable));
    const names = tables.map((table) => sql.identifier(getTableName(table)));

    await this.db.execute(sql`truncate table ${sql.join(names, sql`, `)} cascade`);

    this.cookies.clear();
    this.logger.clear();
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

class StubLogger implements Logger {
  public level: LogLevel;
  public lines: Array<{ level: LogLevel; message: string; context?: LogContext }> = [];

  constructor(level: string) {
    assert(isLogLevel(level));

    this.level = level;
  }

  debug = this.log('debug');
  info = this.log('info');
  warn = this.log('warn');
  error = this.log('error');

  clear() {
    this.lines = [];
  }

  dump(t: HookContext) {
    if (!('passed' in t) || t.passed || this.lines.length === 0) {
      return;
    }

    t.diagnostic(`${this.lines.length} log lines recorded during this test:`);

    for (const { level, message, context } of this.lines) {
      const entries = Object.entries(context ?? {}).filter(([, value]) => value !== undefined);
      const extra = entries.map(([key, value]) => ` ${key}=${inspect(value, { breakLength: Infinity })}`).join('');

      t.diagnostic(`  ${level.padEnd(5)} ${message}${extra}`);
    }
  }

  private log(level: LogLevel) {
    return (message: string, context?: LogContext) => {
      this.lines.push({ level, message, context });
    };
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
