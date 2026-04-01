import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

interface SettingBody {
  key: string;
  value: string;
}

export function registerSettingsRoutes(app: App) {
  // GET /api/settings - Get all settings as key-value map
  app.fastify.get(
    '/api/settings',
    {
      schema: {
        description: 'Get all profile settings',
        tags: ['settings'],
        response: {
          200: {
            description: 'Settings key-value map',
            type: 'object',
            properties: {
              settings: {
                type: 'object',
                additionalProperties: { type: 'string' },
              },
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
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const requireAuth = app.requireAuth();
        const session = await requireAuth(request, reply);
        if (!session) return;

        app.logger.info('Fetching all settings');

        const settingsArray = await app.db
          .select()
          .from(schema.profileSettings);

        const settingsMap: Record<string, string> = {};
        settingsArray.forEach((setting) => {
          settingsMap[setting.key] = setting.value;
        });

        app.logger.info({ count: settingsArray.length }, 'Settings retrieved');
        return { settings: settingsMap };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to get settings');
        return reply.status(500).send({ error: 'Failed to retrieve settings' });
      }
    }
  );

  // POST /api/settings - Upsert a setting
  app.fastify.post<{ Body: SettingBody }>(
    '/api/settings',
    {
      schema: {
        description: 'Create or update a profile setting',
        tags: ['settings'],
        body: {
          type: 'object',
          required: ['key', 'value'],
          properties: {
            key: { type: 'string' },
            value: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Setting updated or created',
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
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
    async (request: FastifyRequest<{ Body: SettingBody }>, reply: FastifyReply) => {
      try {
        const requireAuth = app.requireAuth();
        const session = await requireAuth(request, reply);
        if (!session) return;

        const { key, value } = request.body;

        app.logger.info({ key, value }, 'Upserting setting');

        // Try to find existing setting
        const existingSettings = await app.db
          .select()
          .from(schema.profileSettings)
          .where(eq(schema.profileSettings.key, key))
          .limit(1);
        const existing = existingSettings[0];

        if (existing) {
          // Update existing
          await app.db
            .update(schema.profileSettings)
            .set({
              value,
              updatedAt: new Date(),
            })
            .where(eq(schema.profileSettings.key, key));
        } else {
          // Insert new
          await app.db.insert(schema.profileSettings).values({
            key,
            value,
          });
        }

        app.logger.info({ key }, 'Setting saved');
        return { key, value };
      } catch (error) {
        app.logger.error({ err: error, body: request.body }, 'Failed to update setting');
        return reply.status(500).send({ error: 'Failed to update setting' });
      }
    }
  );
}
