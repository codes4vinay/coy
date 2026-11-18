import dotenv from 'dotenv';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
dotenv.config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)), quiet: true });
const schema = z.object({
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/coy_discover?replicaSet=rs0'),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DNS_SERVERS: z.string().optional(),
});
export const env = schema.parse(process.env);
// Optional process-local override for networks whose DNS refuses Atlas SRV lookups.
if (env.DNS_SERVERS) {
  dns.setServers(
    env.DNS_SERVERS.split(',')
      .map((server) => server.trim())
      .filter(Boolean),
  );
}
if (
  env.NODE_ENV === 'production' &&
  (!process.env.MONGODB_URI || !process.env.WEB_ORIGIN || env.WEB_ORIGIN.includes('localhost'))
)
  throw new Error('Production requires MONGODB_URI and explicit WEB_ORIGIN');
export const DEMO_USER_ID = 'coy-demo-user';
