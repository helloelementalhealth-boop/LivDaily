CREATE TABLE "rituals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"title" text NOT NULL,
	"duration" integer NOT NULL,
	"thumbnail_url" text NOT NULL,
	"tag" text NOT NULL,
	"audio_url" text,
	"content" jsonb NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "rituals" ADD CONSTRAINT "rituals_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rituals_room_id_idx" ON "rituals" USING btree ("room_id");