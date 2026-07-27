import { Command } from 'commander';
import { inArray } from 'drizzle-orm';

import { hashPassword } from './auth/password.ts';
import { db } from './db/client.ts';
import { organizers, organizerTenants, tenants } from './db/schema.ts';

const program = new Command();

program.name('festivapp').description('FestivApp CLI');

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
      .values(tenantRows.map((row) => ({ organizerId: organizer!.id, tenantId: row.id })));

    console.log(`Organizer ${email} ready with access to: ${tenantRows.map((r) => r.domain).join(', ')}`);
  });

await program.parseAsync(process.argv).finally(() => db.$client.end());
