import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { ensureIndexes } from './models/index.js';
import { runKeepAlive } from '../../../scripts/ping-render.mjs';

const keepAliveShutdown = new AbortController();
try {
  mongoose.set('bufferCommands', false);
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await ensureIndexes();
  // Transactions require a replica set (Atlas supports them by default).
  const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid')
    throw new Error('MongoDB must run as a replica set. See README.');
  const server = app.listen(env.PORT, () => {
    console.info(`Coy API listening on http://localhost:${env.PORT}`);
    const renderUrl = process.env.RENDER_EXTERNAL_URL;
    if (env.NODE_ENV === 'production' && process.env.RENDER === 'true' && renderUrl) {
      // Start only after listening; Render supplies the public URL without extra configuration.
      const url = process.env.RENDER_HEALTH_URL || new URL('/health', renderUrl).href;
      void runKeepAlive({ url, signal: keepAliveShutdown.signal }).catch(() => {
        console.error('Render keep-alive could not start. Check the public health URL.');
      });
    }
  });
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => {
      keepAliveShutdown.abort();
      server.close(() => {
        void mongoose.disconnect().then(() => process.exit(0));
      });
    });
} catch {
  console.error(
    'API startup failed. Check MongoDB connectivity and replica-set configuration in README.',
  );
  process.exit(1);
}
