ALTER TABLE "festivals" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "festivals" ALTER COLUMN "domain" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "festivals" ALTER COLUMN "map" DROP NOT NULL;