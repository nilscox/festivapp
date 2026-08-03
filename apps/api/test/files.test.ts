import type { UploadedFile } from '@festivapp/contracts';
import { get } from '@festivapp/utils';
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { useApi } from './helpers/api.ts';
import { createOrganizer, createParticipant, createTenant, theme } from './helpers/fixtures.ts';

import type { Tenant } from '../src/db/schema.ts';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const api = useApi();

let tenant: Tenant;
let other: Tenant;

beforeEach(async () => {
  tenant = await createTenant();
  other = await createTenant();

  const organizer = await createOrganizer({ password: 'hunter2', tenants: [tenant, other] });
  await api.login(organizer.email, 'hunter2');
});

function upload(target: Tenant, body: Buffer, contentType = 'image/png', query = '') {
  return api.post<UploadedFile>(`/admin/tenants/${target.id}/files${query}`, body, {
    headers: { 'content-type': contentType },
  });
}

describe('file upload', () => {
  it('stores an image and serves it back byte for byte', async () => {
    const res = await upload(tenant, png, 'image/png', '?name=logo.png');

    assert.equal(res.status, 201);
    assert.partialDeepStrictEqual(res.body, {
      name: 'logo.png',
      contentType: 'image/png',
      size: png.length,
      url: `/files/${res.body.id}`,
    });

    const download = await api.get<Buffer>(res.body.url);

    assert.equal(download.status, 200);
    assert.deepEqual(download.body, png);
    assert.match(String(download.headers['content-type']), /image\/png/);
    assert.equal(download.headers['content-length'], String(png.length));
    assert.equal(download.headers['cache-control'], 'public, max-age=31536000, immutable');
    assert.equal(download.headers['x-content-type-options'], 'nosniff');
  });

  it('lists the festival files, most recent first', async () => {
    const first = await upload(tenant, png, 'image/png', '?name=first.png');
    const second = await upload(tenant, png, 'image/png', '?name=second.png');
    await upload(other, png);

    const res = await api.get<UploadedFile[]>(`/admin/tenants/${tenant.id}/files`);

    assert.deepEqual(res.body.map(get('id')), [second.body.id, first.body.id]);
  });

  it('rejects an unsupported content type', async () => {
    const res = await upload(tenant, Buffer.from('hello'), 'text/plain');

    assert.equal(res.status, 415);
    assert.deepEqual(res.body, { error: 'unsupported_media_type' });
  });

  it('rejects an empty file', async () => {
    const res = await upload(tenant, Buffer.alloc(0));

    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: 'empty_file' });
  });

  it('rejects a file above the size limit', async () => {
    const res = await upload(tenant, Buffer.alloc(200 * 1024, 1));

    assert.equal(res.status, 413);
    assert.deepEqual(res.body, { error: 'file_too_large' });
  });

  it('responds 404 for an unknown file', async () => {
    const res = await api.get('/files/nope');

    assert.equal(res.status, 404);
  });
});

describe('file deletion', () => {
  it('deletes an unused file', async () => {
    const { body: file } = await upload(tenant, png);

    const res = await api.delete(`/admin/tenants/${tenant.id}/files/${file.id}`);
    assert.equal(res.status, 204);

    const download = await api.get(file.url);
    assert.equal(download.status, 404);
  });

  it('refuses to delete a file used as a participant image', async () => {
    const { body: file } = await upload(tenant, png);
    await createParticipant(tenant, { imageUrl: file.url });

    const res = await api.delete(`/admin/tenants/${tenant.id}/files/${file.id}`);

    assert.equal(res.status, 409);
    assert.deepEqual(res.body, { error: 'file_in_use' });
  });

  it('refuses to delete a file used by the theme', async () => {
    const { body: file } = await upload(tenant, png);

    await api.put(`/admin/tenants/${tenant.id}/theme`, { ...theme, logo: { wordmarkUrl: null, iconUrl: file.url } });

    const res = await api.delete(`/admin/tenants/${tenant.id}/files/${file.id}`);

    assert.equal(res.status, 409);
    assert.deepEqual(res.body, { error: 'file_in_use' });
  });

  it('does not reach a file of another festival', async () => {
    const { body: file } = await upload(other, png);

    const res = await api.delete(`/admin/tenants/${tenant.id}/files/${file.id}`);

    assert.equal(res.status, 404);

    const download = await api.get(file.url);
    assert.equal(download.status, 200);
  });
});
