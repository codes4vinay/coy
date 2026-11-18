import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { ensureIndexes } from './models/index.js';
try {
  mongoose.set('bufferCommands', false);
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await ensureIndexes();
  // Transactions require a replica set (Atlas supports them by default).
  const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid')
    throw new Error('MongoDB must run as a replica set. See README.');
  const server = app.listen(env.PORT, () =>
    console.info(`Coy API listening on http://localhost:${env.PORT}`),
  );
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => {
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
