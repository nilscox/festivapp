import * as z from 'zod/mini';

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
