import type { TenantTheme } from '@festivapp/contracts';
import { assert, defined } from '@festivapp/utils';
import { Command } from 'commander';
import webpush from 'web-push';
import z from 'zod';

import { hashPassword } from './auth/password.ts';
import { closeDatabase, db } from './db/client.ts';
import { organizers, organizerTenants, tenants } from './db/schema.ts';
import { findSubscriptions, pushEnabled, sendToTenant } from './push.ts';
import { seed } from './seed.ts';

const program = new Command();

program.name('festivapp').description('FestivApp CLI');

program
  .command('seed')
  .description('Create a festival, its line-up and its images from a seed file')
  .argument('<file>', 'path to the seed JSON file; its images are relative to it')
  .option('--drop', 'drop existing festival with the same domain')
  .action(async (file: string, { drop }: { drop: boolean }) => {
    try {
      await seed(file, drop);
      console.log(`Seeded ${file}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log(z.prettifyError(error));
        process.exitCode = 1;
      } else {
        throw error;
      }
    }
  });

const organizer = new Command('organizer');
program.addCommand(organizer);

organizer
  .command('create')
  .description('Create an organizer and enroll them in one or more festivals')
  .argument('<email>', 'organizer email', (email) => email.trim().toLowerCase())
  .argument('<password>', 'organizer password')
  .argument('<domains...>', 'one or more festival domains to grant access to')
  .option('-n, --name <name>', 'organizer display name')
  .action(async (email: string, password: string, domains: string[], options: { name?: string }) => {
    const tenantRows = await findTenants(domains);

    const [organizer] = await db
      .insert(organizers)
      .values({ email, passwordHash: hashPassword(password), name: options.name ?? null })
      .returning();

    await db
      .insert(organizerTenants)
      .values(tenantRows.map((row) => ({ organizerId: defined(organizer).id, tenantId: row.id })));

    console.log(`Organizer ${email} ready with access to: ${tenantRows.map((r) => r.domain).join(', ')}`);
  });

organizer
  .command('grant')
  .description('Give an existing organizer access to one or more festivals')
  .argument('<email>', 'organizer email', (email) => email.trim().toLowerCase())
  .argument('<domains...>', 'one or more festival domains to grant access to')
  .action(async (email: string, domains: string[]) => {
    const organizer = await db.query.organizers.findFirst({ where: { email } });

    if (!organizer) {
      throw new Error(`No organizer found for email: ${email}`);
    }

    const tenantRows = await findTenants(domains);

    await db
      .insert(organizerTenants)
      .values(tenantRows.map((row) => ({ organizerId: organizer.id, tenantId: row.id })))
      .onConflictDoNothing();

    console.log(`Organizer ${email} now has access to: ${tenantRows.map((r) => r.domain).join(', ')}`);
  });

const festival = new Command('festival');
program.addCommand(festival);

festival
  .command('create')
  .description('Create a new festival')
  .argument('<name>', 'festival name')
  .option('-t, --timezone <timezone>', 'festival time zone')
  .option('-d, --domain <domain>', 'attendees app domain')
  .action(async (name: string, { timezone = 'Europe/London', domain = 'localhost' }) => {
    const theme: TenantTheme = {
      backgroundColor: '#000000',
      accentColor: '#ffffff',
      fonts: { body: 'sans-serif', display: 'sans-serif', mono: 'monospace' },
      logo: { wordmarkUrl: null, iconUrl: null },
      backgroundImage: null,
      pwa: { name: null, shortName: null },
      customCss: null,
    };

    const [tenant] = await db.insert(tenants).values({ name, theme, timezone, domain }).returning();
    assert(tenant);

    console.log(`Festival ${name} created with id ${tenant.id}`);
  });

const push = new Command('push');
program.addCommand(push);

push
  .command('keys')
  .description('Generate a VAPID key pair to paste into .env')
  .action(() => {
    const { publicKey, privateKey } = webpush.generateVAPIDKeys();

    console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
    console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
  });

push
  .command('test')
  .description('Send a test notification to every device subscribed to a festival')
  .argument('<domain>', 'festival domain')
  .option('-t, --title <title>', 'notification title', 'Test notification')
  .option('-b, --body <body>', 'notification body', 'If you can read this, push works.')
  .option('-s, --subscription <id>', 'send to this subscription only, instead of every device')
  .action(async (domain: string, options: { title: string; body: string; subscription?: string }) => {
    const { title, body, subscription } = options;

    if (!pushEnabled) {
      throw new Error('No VAPID keys configured — run "cli push keys" and put the pair in .env');
    }

    const [tenant] = await findTenants([domain]);
    assert(tenant);

    const subscriptions = await findSubscriptions(tenant.id, subscription);

    if (subscriptions.length === 0) {
      console.log(subscription ? `No subscription ${subscription} on ${domain}` : `No device subscribed to ${domain}`);

      return;
    }

    await sendToTenant(tenant.id, { title, body }, subscription);
  });

async function findTenants(domains: string[]) {
  const rows = await db.query.tenants.findMany({ where: { domain: { in: domains } } });
  const found = new Set(rows.map((row) => row.domain));
  const missing = domains.filter((domain) => !found.has(domain));

  if (missing.length > 0) {
    throw new Error(`No festival found for domain(s): ${missing.join(', ')}`);
  }

  return rows;
}

await program.parseAsync(process.argv).finally(closeDatabase);
