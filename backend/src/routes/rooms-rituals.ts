import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

interface RitualParams {
  id: string;
}

interface RoomParams {
  roomId: string;
}

// Helper function to transform room response
function transformRoom(room: any) {
  return {
    id: room.id,
    slug: room.slug,
    title: room.title,
    sort_order: room.sortOrder,
    created_at: room.createdAt,
  };
}

// Helper function to transform ritual response
function transformRitual(ritual: any) {
  return {
    id: ritual.id,
    room_id: ritual.roomId,
    title: ritual.title,
    duration: ritual.duration,
    thumbnail_url: ritual.thumbnailUrl,
    tag: ritual.tag,
    audio_url: ritual.audioUrl,
    content: ritual.content,
    sort_order: ritual.sortOrder,
    created_at: ritual.createdAt,
  };
}

export function registerRoomsRitualsRoutes(app: App) {
  // GET /api/rooms - List all rooms ordered by sort_order
  app.fastify.get(
    '/api/rooms',
    {
      schema: {
        description: 'Get all rooms',
        tags: ['rooms'],
        response: {
          200: {
            description: 'List of rooms',
            type: 'object',
            properties: {
              rooms: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    slug: { type: 'string' },
                    title: { type: 'string' },
                    sort_order: { type: 'integer' },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        app.logger.info('Fetching all rooms');

        const roomsData = await app.db
          .select()
          .from(schema.rooms)
          .orderBy(schema.rooms.sortOrder);

        const rooms = roomsData.map(transformRoom);

        app.logger.info({ count: rooms.length }, 'Rooms fetched');
        return { rooms };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch rooms');
        return reply.status(500).send({ error: 'Failed to fetch rooms' });
      }
    }
  );

  // GET /api/rooms/:roomId/rituals - Get rituals for a specific room
  app.fastify.get<{ Params: RoomParams }>(
    '/api/rooms/:roomId/rituals',
    {
      schema: {
        description: 'Get rituals for a specific room',
        tags: ['rituals'],
        params: {
          type: 'object',
          required: ['roomId'],
          properties: {
            roomId: { type: 'string', format: 'uuid', description: 'Room ID' },
          },
        },
        response: {
          200: {
            description: 'List of rituals for the room',
            type: 'object',
            properties: {
              rituals: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    room_id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    duration: { type: 'integer' },
                    thumbnail_url: { type: 'string' },
                    tag: { type: 'string' },
                    audio_url: { type: 'string' },
                    content: { type: 'object' },
                    sort_order: { type: 'integer' },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Room not found',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: RoomParams }>, reply: FastifyReply) => {
      try {
        const { roomId } = request.params;

        app.logger.info({ roomId }, 'Fetching rituals for room');

        // Verify room exists
        const roomCheck = await app.db
          .select()
          .from(schema.rooms)
          .where(eq(schema.rooms.id, roomId))
          .limit(1);

        if (!roomCheck[0]) {
          app.logger.info({ roomId }, 'Room not found');
          return reply.status(404).send({ error: 'Room not found' });
        }

        // Get rituals for the room
        const ritualsData = await app.db
          .select()
          .from(schema.rituals)
          .where(eq(schema.rituals.roomId, roomId))
          .orderBy(schema.rituals.sortOrder);

        const rituals = ritualsData.map(transformRitual);

        app.logger.info({ roomId, count: rituals.length }, 'Rituals fetched');
        return { rituals };
      } catch (error) {
        app.logger.error({ err: error, roomId: request.params.roomId }, 'Failed to fetch rituals');
        return reply.status(500).send({ error: 'Failed to fetch rituals' });
      }
    }
  );

  // GET /api/rituals/:id - Get a single ritual
  app.fastify.get<{ Params: RitualParams }>(
    '/api/rituals/:id',
    {
      schema: {
        description: 'Get a single ritual',
        tags: ['rituals'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Ritual ID' },
          },
        },
        response: {
          200: {
            description: 'Ritual details',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              room_id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              duration: { type: 'integer' },
              thumbnail_url: { type: 'string' },
              tag: { type: 'string' },
              audio_url: { type: 'string' },
              content: { type: 'object' },
              sort_order: { type: 'integer' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            description: 'Ritual not found',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: RitualParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        app.logger.info({ ritualId: id }, 'Fetching ritual');

        const ritualsData = await app.db
          .select()
          .from(schema.rituals)
          .where(eq(schema.rituals.id, id))
          .limit(1);

        const ritual = ritualsData[0];

        if (!ritual) {
          app.logger.info({ ritualId: id }, 'Ritual not found');
          return reply.status(404).send({ error: 'Ritual not found' });
        }

        app.logger.info({ ritualId: id }, 'Ritual fetched');
        return transformRitual(ritual);
      } catch (error) {
        app.logger.error({ err: error, ritualId: request.params.id }, 'Failed to fetch ritual');
        return reply.status(500).send({ error: 'Failed to fetch ritual' });
      }
    }
  );
}
