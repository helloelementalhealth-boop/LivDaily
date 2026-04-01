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
              'You are the editorial intelligence engine for livdaily — a high-end, editorial-first productivity platform. Your voice is precise, measured, and authoritative. Write like a seasoned editor at a world-class publication. No hype, no fluff. Every word earns its place.',
            prompt: `Generate a daily briefing for ${targetDate}. Return a JSON object with: headline (a sharp, single-sentence editorial headline, lowercase, no period), body (3-5 sentences of substantive editorial insight about focus, productivity, and intentional living — written in a refined, literary style), cta_label (always exactly: 'commence protocol'). Return only valid JSON.`,
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

        const { date, headline, body, cta_label } = request.body;

        app.logger.info({ date, headline }, 'Overriding briefing');

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
              ctaLabel: cta_label || 'commence protocol',
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
              ctaLabel: cta_label || 'commence protocol',
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
