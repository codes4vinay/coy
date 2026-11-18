import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Profile, Swipe, Match, Preferences, ensureIndexes } from '../models/index.js';
import { seedProfiles } from './profiles.js';
// This entry point may clear only the explicitly named, disposable browser-test database.
if (!env.MONGODB_URI.includes('/coy_discover_e2e?'))
  throw new Error('E2E requires the isolated coy_discover_e2e database.');
await mongoose.connect(env.MONGODB_URI);
await ensureIndexes();
await Promise.all([
  Profile.deleteMany({}),
  Swipe.deleteMany({}),
  Match.deleteMany({}),
  Preferences.deleteMany({}),
]);
await Profile.insertMany(seedProfiles);
const { app } = await import('../app.js');
const server = app.listen(env.PORT, () =>
  console.info(`Isolated browser-test API on port ${env.PORT}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    server.close(() => {
      void mongoose.disconnect().then(() => process.exit(0));
    });
  });
