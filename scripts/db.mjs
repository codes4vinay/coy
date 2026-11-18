import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
const port = 27018;
// Keep durable demo data separate from any system MongoDB service or disposable test database.
const directory = resolve('.runtime/mongodb');
await mkdir(directory, { recursive: true });
const binary =
  process.env.MONGOD_BINARY ||
  (process.platform === 'win32'
    ? 'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe'
    : 'mongod');
const child = spawn(
  binary,
  [
    '--dbpath',
    directory,
    '--port',
    String(port),
    '--bind_ip',
    '127.0.0.1',
    '--replSet',
    'coy-local',
    '--logpath',
    resolve('.runtime/mongodb.log'),
    '--logappend',
  ],
  { windowsHide: true, stdio: 'ignore' },
);
child.on('error', () => {
  console.error('Cannot start mongod. Install MongoDB Community or set MONGOD_BINARY.');
  process.exit(1);
});
let stopped = false;
child.on('exit', (code) => {
  stopped = true;
  if (code) {
    console.error(`mongod exited (${code}). Inspect .runtime/mongodb.log; check port 27018.`);
    process.exit(code);
  }
});
let connected = false;
for (let attempt = 0; attempt < 40 && !stopped; attempt++) {
  try {
    await mongoose.connect(`mongodb://127.0.0.1:${port}/?directConnection=true`, {
      serverSelectionTimeoutMS: 1000,
    });
    connected = true;
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 500));
  }
}
if (!connected) {
  child.kill();
  throw new Error('Local MongoDB did not become ready.');
}
const admin = mongoose.connection.db.admin();
// A single-node replica set provides the same transaction support used on Atlas.
try {
  await admin.command({ replSetGetStatus: 1 });
} catch {
  await admin.command({
    replSetInitiate: { _id: 'coy-local', members: [{ _id: 0, host: `127.0.0.1:${port}` }] },
  });
}
for (let attempt = 0; attempt < 40; attempt++) {
  const hello = await admin.command({ hello: 1 });
  if (hello.isWritablePrimary) break;
  await new Promise((r) => setTimeout(r, 500));
}
await mongoose.disconnect();
console.info(
  'Persistent local MongoDB ready on port 27018. Leave this terminal open. Data: .runtime/mongodb',
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill());
