import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

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
