CREATE TYPE "eventType" AS ENUM('live', 'dj_set', 'talk', 'workshop');--> statement-breakpoint
CREATE TABLE "artists" (
	"id" varchar(8) PRIMARY KEY,
	"festivalId" varchar(8) NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" varchar(255),
	"styles" varchar(255)[] NOT NULL,
	"origin" varchar(255),
	"label" varchar(255),
	"description" text,
	"social" varchar(255)[]
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar(8) PRIMARY KEY,
	"festivalId" varchar(8) NOT NULL,
	"locationId" varchar(8) NOT NULL,
	"type" "eventType",
	"start" timestamp NOT NULL,
	"end" timestamp NOT NULL,
	"title" varchar(255),
	"description" text,
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "artists_events" (
	"eventId" varchar(8),
	"artistId" varchar(8),
	CONSTRAINT "artists_events_pkey" PRIMARY KEY("eventId","artistId")
);
--> statement-breakpoint
CREATE TABLE "festivals" (
	"id" varchar(8) PRIMARY KEY,
	"name" varchar(255) UNIQUE,
	"start" timestamp NOT NULL,
	"end" timestamp NOT NULL,
	"map" varchar(255) NOT NULL,
	"primaryColor" varchar(16),
	"accentColor" varchar(16),
	"backgroundImage" varchar(255),
	"globalStyles" varchar(255),
	"beforeStartInfo" text,
	"afterEndInfo" text
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" varchar(8) PRIMARY KEY,
	"userId" varchar(8) NOT NULL,
	"postId" varchar(8) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" varchar(8) PRIMARY KEY,
	"festivalId" varchar(8) NOT NULL,
	"label" varchar(255) NOT NULL,
	"sortOrder" integer
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" varchar(8) PRIMARY KEY,
	"festivalId" varchar(8) NOT NULL,
	"authorId" varchar(8) NOT NULL,
	"parentId" varchar(8),
	"message" text NOT NULL,
	"postedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speakers" (
	"id" varchar(8) PRIMARY KEY,
	"festivalId" varchar(8) NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" varchar(255) NOT NULL,
	"origin" varchar(255),
	"position" varchar(255),
	"description" text,
	"social" varchar(255)[]
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(8) PRIMARY KEY,
	"festivalId" varchar(8) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"authCode" varchar(6),
	"imageRef" varchar(16),
	CONSTRAINT "users_festivalId_email_unique" UNIQUE("festivalId","email")
);
--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_festivalId_festivals_id_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_festivalId_festivals_id_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id");--> statement-breakpoint
ALTER TABLE "artists_events" ADD CONSTRAINT "artists_events_eventId_events_id_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id");--> statement-breakpoint
ALTER TABLE "artists_events" ADD CONSTRAINT "artists_events_artistId_artists_id_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id");--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_postId_posts_id_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id");--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_festivalId_festivals_id_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_festivalId_festivals_id_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_users_id_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_parentId_posts_id_fkey" FOREIGN KEY ("parentId") REFERENCES "posts"("id");--> statement-breakpoint
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_festivalId_festivals_id_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_festivalId_festivals_id_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id");