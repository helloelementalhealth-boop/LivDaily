import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

interface ReportQuerystring {
  date?: string;
}

// Helper function to transform database response to snake_case for API response
function transformReport(report: any) {
  return {
    id: report.id,
    report_date: report.reportDate,
    title: report.title,
    content: report.content,
    created_at: report.createdAt,
  };
}

export function registerReportsRoutes(app: App) {
  // GET /api/reports/today - Get today's report
  app.fastify.get<{ Querystring: ReportQuerystring }>(
    '/api/reports/today',
    {
      schema: {
        description: 'Get daily report',
        tags: ['reports'],
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
            description: 'Full report',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              report_date: { type: 'string' },
              title: { type: 'string' },
              content: { type: 'string' },
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
          404: {
            description: 'Report not found',
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
    async (request: FastifyRequest<{ Querystring: ReportQuerystring }>, reply: FastifyReply) => {
      try {
        const requireAuth = app.requireAuth();
        const session = await requireAuth(request, reply);
        if (!session) return;

        const targetDate = request.query.date || new Date().toISOString().split('T')[0];

        app.logger.info({ date: targetDate }, 'Fetching report');

        const reports = await app.db
          .select()
          .from(schema.fullReports)
          .where(eq(schema.fullReports.reportDate, targetDate))
          .limit(1);
        const report = reports[0];

        if (!report) {
          app.logger.info({ date: targetDate }, 'Report not found');
          return reply.status(404).send({ error: 'Report not found' });
        }

        app.logger.info({ reportId: report.id }, 'Report found');
        return transformReport(report);
      } catch (error) {
        app.logger.error({ err: error, date: request.query.date }, 'Failed to get report');
        return reply.status(500).send({ error: 'Failed to retrieve report' });
      }
    }
  );
}
