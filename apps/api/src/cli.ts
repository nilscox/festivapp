import type { TenantTheme } from '@festivapp/contracts';
import { assert, defined } from '@festivapp/utils';
import { Command } from 'commander';
import { inArray } from 'drizzle-orm';

import { hashPassword } from './auth/password.ts';
import { db } from './db/client.ts';
import { organizers, organizerTenants, tenants } from './db/schema.ts';
import { seed } from './seed.ts';

const program = new Command();

program.name('festivapp').description('FestivApp CLI');

program
  .command('seed')
  .description('Create a festival, its line-up and its images from a seed file')
  .argument('<file>', 'path to the seed JSON file; its images are relative to it')
  .action(async (file: string) => {
    await seed(file);

    console.log(`Seeded ${file}`);
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
    const tenantRows = await db.select().from(tenants).where(inArray(tenants.domain, domains));
    const foundDomains = new Set(tenantRows.map((row) => row.domain));
    const missing = domains.filter((domain) => !foundDomains.has(domain));

    if (missing.length > 0) {
      throw new Error(`No festival found for domain(s): ${missing.join(', ')}`);
    }

    const [organizer] = await db
      .insert(organizers)
      .values({ email, passwordHash: hashPassword(password), name: options.name ?? null })
      .returning();

    await db
      .insert(organizerTenants)
      .values(tenantRows.map((row) => ({ organizerId: defined(organizer).id, tenantId: row.id })));

    console.log(`Organizer ${email} ready with access to: ${tenantRows.map((r) => r.domain).join(', ')}`);
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

await program.parseAsync(process.argv).finally(() => db.$client.end());
