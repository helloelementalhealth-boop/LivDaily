import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import { gateway } from '@specific-dev/framework';
import { generateText } from 'ai';

interface BriefingQuerystring {
  date?: string;
}

interface BriefingOverrideBody {
  date: string;
  headline: string;
  body: string;
  cta_label?: string;
}

// Helper function to transform database response to snake_case for API response
function transformBriefing(briefing: any) {
  return {
    id: briefing.id,
    briefing_date: briefing.briefingDate,
    headline: briefing.headline,
    body: briefing.body,
    cta_label: briefing.ctaLabel,
    is_override: briefing.isOverride,
    created_at: briefing.createdAt,
  };
}

// Sanitization function to enforce character constraints
function sanitizeBriefingText(text: string): string {
  let sanitized = text;

  // Replace em dashes with period + space
  sanitized = sanitized.replace(/—/g, '. ');

  // Replace en dashes with period + space
  sanitized = sanitized.replace(/–/g, '. ');

  // Replace exclamation points with periods
  sanitized = sanitized.replace(/!/g, '.');

  // Strip all emoji characters (unicode ranges for emoji)
  sanitized = sanitized.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

  // Collapse double periods
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // Clean up ". ." artifacts
  sanitized = sanitized.replace(/\.\s*\./g, '.');

  // Clean up multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

export function registerBriefingsRoutes(app: App) {
  // GET /api/briefings/today - Get or generate today's briefing
  app.fastify.get<{ Querystring: BriefingQuerystring }>(
    '/api/briefings/today',
    {
      schema: {
        description: 'Get or generate daily briefing',
        tags: ['briefings'],
        querystring: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'ISO date string (YYYY-MM-DD), defaults to today',
            },
          },
        },
        response: {
          200: {
            description: 'Daily briefing',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              briefing_date: { type: 'string' },
              headline: { type: 'string' },
              body: { type: 'string' },
              cta_label: { type: 'string' },
              is_override: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: BriefingQuerystring }>, reply: FastifyReply) => {
      try {
        const targetDate = request.query.date || new Date().toISOString().split('T')[0];

        app.logger.info({ date: targetDate }, 'Fetching briefing');

        // Check if briefing exists
        const briefings = await app.db
          .select()
          .from(schema.dailyBriefings)
          .where(eq(schema.dailyBriefings.briefingDate, targetDate))
          .limit(1);
        const briefing = briefings[0];

        if (briefing) {
          app.logger.info({ briefingId: briefing.id }, 'Briefing found');
          return transformBriefing(briefing);
        }

        // Generate new briefing using AI
        app.logger.info({ date: targetDate }, 'Generating new briefing with AI');

        let text: string;
        try {
          const result = await generateText({
            model: gateway('openai/gpt-4o-mini'),
            system:
              'You are a briefing writer. Your job is to produce a short, clear daily briefing.\n\nVoice rules:\n- Professional and structured, but not stiff or corporate.\n- Short lines. Clean phrasing.\n- Human and warm, but not caretaking. No soothing or instructive language.\n- Use real-life, high-impact words (move, shift, block, signal, noise) instead of academic or philosophical terms.\n- Start with the core thesis. No wind-up.\n\nBanned phrases — never use:\n- "In an era of..."\n- "It is important to..."\n- "I hope..."\n- "You should..."\n- Any filler or throat-clearing before the main point.\n\nStrict character bans — these characters must NEVER appear in your output:\n- NO em dashes (—)\n- NO en dashes (–)\n- NO emojis of any kind\n- NO exclamation points (!)\n- NO ALL CAPS words\n- NO Title Case for body text (sentence case only)\n\nIf a sentence would need a dash for complexity, rewrite it as two shorter sentences instead.\nUse periods or line breaks to separate thoughts.\n\nOutput format:\n- headline: A single sentence in sentence case. No punctuation at the end unless it is a period.\n- body: 3 to 5 short paragraphs. Each paragraph is 1 to 3 sentences. Sentence case throughout.\n- cta_label: 2 to 4 words. Sentence case. No punctuation.',
            prompt: `Generate a daily briefing for ${targetDate}. Return a JSON object with: headline (a single sentence in sentence case), body (3 to 5 paragraphs, 1 to 3 sentences each), cta_label (2 to 4 words, sentence case). Return only valid JSON.`,
          });
          text = result.text;
        } catch (aiError) {
          app.logger.error({ err: aiError, date: targetDate }, 'AI generation failed');
          throw aiError;
        }

        let generatedContent;
        try {
          generatedContent = JSON.parse(text);
        } catch (parseError) {
          app.logger.error({ err: parseError, text }, 'Failed to parse AI response');
          throw new Error('Failed to parse AI-generated briefing');
        }

        // Sanitize the generated content
        generatedContent.headline = sanitizeBriefingText(generatedContent.headline);
        generatedContent.body = sanitizeBriefingText(generatedContent.body);
        generatedContent.cta_label = sanitizeBriefingText(generatedContent.cta_label);

        // Insert into database
        const [newBriefing] = await app.db
          .insert(schema.dailyBriefings)
          .values({
            briefingDate: targetDate,
            headline: generatedContent.headline,
            body: generatedContent.body,
            ctaLabel: generatedContent.cta_label || 'commence protocol',
            isOverride: false,
          })
          .returning();

        app.logger.info({ briefingId: newBriefing.id }, 'Briefing generated and saved');
        return transformBriefing(newBriefing);
      } catch (error) {
        app.logger.error({ err: error, date: request.query.date }, 'Failed to get briefing');
        return reply.status(500).send({ error: 'Failed to generate briefing' });
      }
    }
  );

  // POST /api/briefings/override - Override or create briefing
  app.fastify.post<{ Body: BriefingOverrideBody }>(
    '/api/briefings/override',
    {
      schema: {
        description: 'Override or create a daily briefing',
        tags: ['briefings'],
        body: {
          type: 'object',
          required: ['date', 'headline', 'body'],
          properties: {
            date: { type: 'string', description: 'ISO date (YYYY-MM-DD)' },
            headline: { type: 'string' },
            body: { type: 'string' },
            cta_label: { type: 'string', default: 'commence protocol' },
          },
        },
        response: {
          200: {
            description: 'Briefing updated or created',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              briefing_date: { type: 'string' },
              headline: { type: 'string' },
              body: { type: 'string' },
              cta_label: { type: 'string' },
              is_override: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: BriefingOverrideBody }>, reply: FastifyReply) => {
      try {
        const requireAuth = app.requireAuth();
        const session = await requireAuth(request, reply);
        if (!session) return;

        const { date, headline: rawHeadline, body: rawBody, cta_label: rawCtaLabel } = request.body;

        app.logger.info({ date, headline: rawHeadline }, 'Overriding briefing');

        // Sanitize the input content
        const headline = sanitizeBriefingText(rawHeadline);
        const body = sanitizeBriefingText(rawBody);
        const cta_label = rawCtaLabel ? sanitizeBriefingText(rawCtaLabel) : 'commence protocol';

        // Try to find existing briefing
        const existingBriefings = await app.db
          .select()
          .from(schema.dailyBriefings)
          .where(eq(schema.dailyBriefings.briefingDate, date))
          .limit(1);
        const existing = existingBriefings[0];

        let result;
        if (existing) {
          // Update existing
          [result] = await app.db
            .update(schema.dailyBriefings)
            .set({
              headline,
              body,
              ctaLabel: cta_label,
              isOverride: true,
            })
            .where(eq(schema.dailyBriefings.briefingDate, date))
            .returning();
        } else {
          // Insert new
          [result] = await app.db
            .insert(schema.dailyBriefings)
            .values({
              briefingDate: date,
              headline,
              body,
              ctaLabel: cta_label,
              isOverride: true,
            })
            .returning();
        }

        app.logger.info({ briefingId: result.id }, 'Briefing override saved');
        return transformBriefing(result);
      } catch (error) {
        app.logger.error({ err: error, body: request.body }, 'Failed to override briefing');
        return reply.status(500).send({ error: 'Failed to override briefing' });
      }
    }
  );
}
