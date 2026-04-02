import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';

export const dailyBriefings = pgTable('daily_briefings', {
  id: uuid('id').primaryKey().defaultRandom(),
  briefingDate: text('briefing_date').unique().notNull(),
  headline: text('headline').notNull(),
  body: text('body').notNull(),
  ctaLabel: text('cta_label').notNull().default('commence protocol'),
  isOverride: boolean('is_override').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fullReports = pgTable('full_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportDate: text('report_date').unique().notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const profileSettings = pgTable('profile_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').unique().notNull(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rituals = pgTable(
  'rituals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    duration: integer('duration').notNull(),
    thumbnailUrl: text('thumbnail_url').notNull(),
    tag: text('tag').notNull(),
    audioUrl: text('audio_url'),
    content: jsonb('content').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    roomIdIdx: index('rituals_room_id_idx').on(table.roomId),
  })
);
