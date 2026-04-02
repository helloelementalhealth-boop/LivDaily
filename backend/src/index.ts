import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';
import { registerBriefingsRoutes } from './routes/briefings.js';
import { registerReportsRoutes } from './routes/reports.js';
import { registerSettingsRoutes } from './routes/settings.js';
import { registerRoomsRitualsRoutes } from './routes/rooms-rituals.js';
import { seedData } from './seed.js';

const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Set up authentication with Better Auth
app.withAuth();

// Seed initial data
await seedData(app);

// Register routes
registerBriefingsRoutes(app);
registerReportsRoutes(app);
registerSettingsRoutes(app);
registerRoomsRitualsRoutes(app);

await app.run();
app.logger.info('Application running');
