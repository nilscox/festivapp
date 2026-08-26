import type { BootstrapResponse } from '@festivapp/contracts';
import { get } from '@festivapp/utils';
import { sub } from 'date-fns';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { TestSuite } from './helpers/api.ts';
import { fixtures } from './helpers/fixtures.ts';

const suite = TestSuite.create();
const create = fixtures(suite.db);

describe('GET /bootstrap', () => {
  it('returns the whole festival, and nothing but the contract fields', async (t) => {
    const api = suite.api(t);

    const tenant = await create.tenant({ domain: 'coolfest.localhost', name: 'Cool Fest', mapUrl: '/files/map' });
    const stage = await create.location(tenant, { name: 'Main stage', description: 'Outdoors', position: 1 });
    const artist = await create.participant(tenant, { name: 'Artist', origin: 'FR', styles: ['psytrance'] });

    const session = await create.session(tenant, stage, {
      type: 'dj_set',
      startsAt: new Date('2026-07-01T22:00:00Z'),
      endsAt: new Date('2026-07-01T23:30:00Z'),
      participants: [artist],
    });

    const message = await create.message(tenant, { title: 'Gates are open', body: 'Come on in.' });

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
          hideOnBreak: false,
          mapPin: { x: 50, y: 50, labelPosition: 'bottom' },
        },
      ],
      participants: [
        {
          id: artist.id,
          name: 'Artist',
          description: null,
          imageUrl: null,
          imagePosition: { x: 50, y: 50 },
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

  it('excludes the data of other tenants', async (t) => {
    const api = suite.api(t);

    const tenant = await create.tenant({ domain: 'coolfest.localhost' });
    const other = await create.tenant({ domain: 'other.localhost' });

    const stage = await create.location(tenant, { name: 'Main stage' });
    const otherStage = await create.location(other, { name: 'Other stage' });

    await create.participant(other, { name: 'Other artist' });
    await create.session(other, otherStage);
    await create.message(other, { title: 'Other announcement' });

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'coolfest.localhost' });

    assert.deepEqual(res.body.locations.map(get('id')), [stage.id]);
    assert.deepEqual(res.body.participants, []);
    assert.deepEqual(res.body.sessions, []);
    assert.deepEqual(res.body.messages, []);
  });

  it('sorts messages newest first', async (t) => {
    const api = suite.api(t);

    const tenant = await create.tenant({ domain: 'coolfest.localhost' });

    const older = await create.message(tenant, { createdAt: sub(Date.now(), { hours: 1 }) });
    const newer = await create.message(tenant);

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'coolfest.localhost' });

    assert.deepEqual(res.body.messages.map(get('id')), [newer.id, older.id]);
  });

  it('sorts locations by position, participants by name and sessions by start time', async (t) => {
    const api = suite.api(t);

    const tenant = await create.tenant({ domain: 'coolfest.localhost' });

    const second = await create.location(tenant, { name: 'Second', position: 2 });
    const first = await create.location(tenant, { name: 'First', position: 1 });

    await create.participant(tenant, { name: 'Zoe' });
    await create.participant(tenant, { name: 'Amir' });

    const late = await create.session(tenant, first, { startsAt: new Date('2026-07-01T23:00:00Z') });
    const early = await create.session(tenant, second, { startsAt: new Date('2026-07-01T20:00:00Z') });

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'coolfest.localhost' });

    assert.deepEqual(res.body.locations.map(get('id')), [first.id, second.id]);
    assert.deepEqual(res.body.participants.map(get('name')), ['Amir', 'Zoe']);
    assert.deepEqual(res.body.sessions.map(get('id')), [early.id, late.id]);
  });

  it('lists the participants of a session in their line-up order', async (t) => {
    const api = suite.api(t);

    const tenant = await create.tenant({ domain: 'coolfest.localhost' });
    const stage = await create.location(tenant);

    const headliner = await create.participant(tenant, { name: 'Zoe' });
    const support = await create.participant(tenant, { name: 'Amir' });

    await create.session(tenant, stage, { participants: [headliner, support] });

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'coolfest.localhost' });
    const [session] = res.body.sessions;

    assert.deepEqual(session?.participantIds, [headliner.id, support.id]);
  });
});
