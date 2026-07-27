CREATE TABLE "auth_sessions" (
	"token" text PRIMARY KEY,
	"organizer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizer_tenants" (
	"organizer_id" uuid,
	"tenant_id" uuid,
	CONSTRAINT "organizer_tenants_pkey" PRIMARY KEY("organizer_id","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "organizers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_organizer_id_organizers_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organizer_tenants" ADD CONSTRAINT "organizer_tenants_organizer_id_organizers_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organizer_tenants" ADD CONSTRAINT "organizer_tenants_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;