import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from './app.ts';

describe('GET /health', () => {
  it('returns ok without needing a tenant', async () => {
    const res = await request(createApp()).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
