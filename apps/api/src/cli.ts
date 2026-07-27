import { Command } from 'commander';
import { inArray } from 'drizzle-orm';

import { hashPassword } from './auth/password.ts';
import { db } from './db/client.ts';
import { organizers, organizerTenants, tenants } from './db/schema.ts';

const program = new Command();

program.name('festivapp').description('FestivApp API maintenance CLI');

program
  .command('create-organizer')
  .description('Create (or update) an organizer and enroll them in one or more festivals')
  .argument('<email>', 'organizer email')
  .argument('<password>', 'organizer password')
  .argument('<domains...>', 'one or more festival domains to grant access to')
  .option('-n, --name <name>', 'organizer display name')
  .action(async (email: string, password: string, domains: string[], options: { name?: string }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const tenantRows = await db.select().from(tenants).where(inArray(tenants.domain, domains));
    const foundDomains = new Set(tenantRows.map((row) => row.domain));
    const missing = domains.filter((domain) => !foundDomains.has(domain));

    if (missing.length > 0) {
      throw new Error(`No festival found for domain(s): ${missing.join(', ')}`);
    }

    const [organizer] = await db
      .insert(organizers)
      .values({ email: normalizedEmail, passwordHash: hashPassword(password), name: options.name ?? null })
      .onConflictDoUpdate({
        target: organizers.email,
        set: { passwordHash: hashPassword(password), name: options.name ?? null, updatedAt: new Date() },
      })
      .returning();

    await db
      .insert(organizerTenants)
      .values(tenantRows.map((row) => ({ organizerId: organizer!.id, tenantId: row.id })))
      .onConflictDoNothing();

    console.log(`Organizer ${normalizedEmail} ready with access to: ${tenantRows.map((r) => r.domain).join(', ')}`);
  });

try {
  await program.parseAsync(process.argv);
} finally {
  await db.$client.end();
}
