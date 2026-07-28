import * as z from 'zod/mini';

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = new Headers();

  const init: RequestInit = {
    method,
    credentials: 'include',
    headers,
  };

  if (body !== undefined) {
    headers.set('Content-Type', body instanceof File ? body.type : 'application/json');
    init.body = body instanceof File ? body : JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, init);

  const resBody: unknown = res.headers.get('Content-Type')?.startsWith('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, resBody);
  }

  return resBody as T;
}

export class ApiError extends Error {
  private static bodySchema = z.object({
    message: z.optional(z.string()),
    error: z.optional(z.string()),
  });

  readonly status: number;
  readonly body: unknown;
  readonly error?: string;

  constructor(status: number, body: unknown) {
    const { success, data } = ApiError.bodySchema.safeParse(body);

    super(success ? (data.message ?? data.error) : 'API Error');

    this.name = 'ApiError';
    this.status = status;
    this.body = body;

    if (success) {
      this.error = data.error;
    }
  }

  static is(value: unknown, status?: number): value is ApiError {
    return value instanceof this && (status === undefined || value.status === status);
  }
}
