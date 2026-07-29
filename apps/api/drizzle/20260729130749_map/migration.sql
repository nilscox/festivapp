ALTER TABLE "locations" ADD COLUMN "map_x" real DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "map_y" real DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "map_url" text;