import type { BootstrapResponse } from '@festivapp/contracts';
import { sub } from 'date-fns';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { useApi } from './helpers/api.ts';
import { createLocation, createMessage, createParticipant, createSession, createTenant } from './helpers/fixtures.ts';

const api = useApi();

describe('GET /bootstrap', () => {
  it('returns the whole festival, and nothing but the contract fields', async () => {
    const tenant = await createTenant({ domain: 'coolfest.localhost', name: 'Cool Fest', mapUrl: '/files/map' });
    const stage = await createLocation(tenant, { name: 'Main stage', description: 'Outdoors', position: 1 });
    const artist = await createParticipant(tenant, { name: 'Artist', origin: 'FR', styles: ['psytrance'] });

    const session = await createSession(tenant, stage, {
      type: 'dj_set',
      startsAt: new Date('2026-07-01T22:00:00Z'),
      endsAt: new Date('2026-07-01T23:30:00Z'),
      participants: [artist],
    });

    const message = await createMessage(tenant, { title: 'Gates are open', body: 'Come on in.' });

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'coolfest.localhost' });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      tenant: {
        id: tenant.id,
        name: 'Cool Fest',
        domain: 'coolfest.localhost',
        timezone: 'Europe/Paris',
        mapUrl: '/files/map',
        theme: tenant.theme,
      },
      locations: [
        {
          id: stage.id,
          name: 'Main stage',
          description: 'Outdoors',
          position: 1,
          mapPin: { x: 50, y: 50, labelPosition: 'bottom' },
        },
      ],
      participants: [
        {
          id: artist.id,
          name: 'Artist',
          description: null,
          imageUrl: null,
          origin: 'FR',
          label: null,
          styles: ['psytrance'],
          socialLinks: [],
        },
      ],
      sessions: [
        {
          id: session.id,
          locationId: stage.id,
          type: 'dj_set',
          title: null,
          description: null,
          startsAt: '2026-07-01T22:00:00.000Z',
          endsAt: '2026-07-01T23:30:00.000Z',
          participantIds: [artist.id],
        },
      ],
      messages: [
        {
          id: message.id,
          title: 'Gates are open',
          body: 'Come on in.',
          createdAt: message.createdAt.toISOString(),
        },
      ],
      pushPublicKey: null,
    });
  });

  it('excludes the data of other tenants', async () => {
    const tenant = await createTenant({ domain: 'coolfest.localhost' });
    const other = await createTenant({ domain: 'other.localhost' });

    const stage = await createLocation(tenant, { name: 'Main stage' });
    const otherStage = await createLocation(other, { name: 'Other stage' });

    await createParticipant(other, { name: 'Other artist' });
    await createSession(other, otherStage);
    await createMessage(other, { title: 'Other announcement' });

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'coolfest.localhost' });

    assert.deepEqual(
      res.body.locations.map(({ id }) => id),
      [stage.id],
    );

    assert.deepEqual(res.body.participants, []);
    assert.deepEqual(res.body.sessions, []);
    assert.deepEqual(res.body.messages, []);
  });

  it('sorts messages newest first', async () => {
    const tenant = await createTenant({ domain: 'coolfest.localhost' });

    const older = await createMessage(tenant, { createdAt: sub(Date.now(), { hours: 1 }) });
    const newer = await createMessage(tenant);

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'coolfest.localhost' });

    assert.deepEqual(
      res.body.messages.map(({ id }) => id),
      [newer.id, older.id],
    );
  });

  it('sorts locations by position, participants by name and sessions by start time', async () => {
    const tenant = await createTenant({ domain: 'coolfest.localhost' });

    const second = await createLocation(tenant, { name: 'Second', position: 2 });
    const first = await createLocation(tenant, { name: 'First', position: 1 });

    await createParticipant(tenant, { name: 'Zoe' });
    await createParticipant(tenant, { name: 'Amir' });

    const late = await createSession(tenant, first, { startsAt: new Date('2026-07-01T23:00:00Z') });
    const early = await createSession(tenant, second, { startsAt: new Date('2026-07-01T20:00:00Z') });

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'coolfest.localhost' });

    assert.deepEqual(
      res.body.locations.map(({ id }) => id),
      [first.id, second.id],
    );

    assert.deepEqual(
      res.body.participants.map(({ name }) => name),
      ['Amir', 'Zoe'],
    );

    assert.deepEqual(
      res.body.sessions.map(({ id }) => id),
      [early.id, late.id],
    );
  });

  it('lists the participants of a session in their line-up order', async () => {
    const tenant = await createTenant({ domain: 'coolfest.localhost' });
    const stage = await createLocation(tenant);

    const headliner = await createParticipant(tenant, { name: 'Zoe' });
    const support = await createParticipant(tenant, { name: 'Amir' });

    await createSession(tenant, stage, { participants: [headliner, support] });

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'coolfest.localhost' });
    const [session] = res.body.sessions;

    assert.deepEqual(session?.participantIds, [headliner.id, support.id]);
  });
});
