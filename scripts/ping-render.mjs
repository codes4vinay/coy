import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const healthUrl = process.env.RENDER_HEALTH_URL || 'https://coy-9vf6.onrender.com/health';
const attempts = 3;
const timeoutMs = 75_000;
const intervalMs = 14 * 60 * 1000;
async function pingRender(endpoint, signal) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const started = Date.now();
    try {
      // Use the public URL so the request passes through Render's inbound HTTP routing.
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json', 'User-Agent': 'Coy-Discover-Health-Check' },
        cache: 'no-store',
        signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]),
      });
      if (!response.ok) throw new Error(`Health endpoint returned HTTP ${response.status}.`);
      const health = await response.json().catch(() => null);
      if (health?.success !== true)
        throw new Error('API did not report a healthy database connection.');
      console.info(`Render health check passed in ${Date.now() - started}ms (attempt ${attempt}).`);
      return;
    } catch (error) {
      if (signal.aborted) return;
      const message = error instanceof Error ? error.message : 'Unknown connection error.';
      console.error(`Health check ${attempt}/${attempts} failed: ${message}`);
      if (attempt === attempts)
        throw new Error('Render did not become healthy after three attempts.');
      // Allow an initial cold start or deployment restart to recover before the next check.
      await delay(5000, undefined, { signal });
    }
  }
}

export async function runKeepAlive({
  url = healthUrl,
  signal = new AbortController().signal,
  once = false,
} = {}) {
  const endpoint = new URL(url);
  if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) {
    throw new Error('Use an HTTP(S) health URL without embedded credentials.');
  }

  if (once) {
    await pingRender(endpoint, signal);
    return;
  }

  console.info('Render keep-alive started. Pinging now, then every 14 minutes.');
  while (!signal.aborted) {
    const started = Date.now();
    try {
      await pingRender(endpoint, signal);
    } catch (error) {
      if (signal.aborted) break;
      // A temporary outage must not terminate the recurring process.
      console.error(error instanceof Error ? error.message : 'Health check failed.');
    }
    if (signal.aborted) break;
    // Schedule from the request's start, so response time does not stretch the 14-minute interval.
    const waitMs = Math.max(0, intervalMs - (Date.now() - started));
    console.info(`Next health check in ${Math.ceil(waitMs / 60_000)} minutes.`);
    try {
      await delay(waitMs, undefined, { signal });
    } catch (error) {
      if (!signal.aborted) throw error;
    }
  }
}

// Importing the helper does not start a second loop or install process-level signal handlers.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const shutdown = new AbortController();
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => shutdown.abort());
  runKeepAlive({ signal: shutdown.signal, once: process.argv.includes('--once') })
    .catch((error) => {
      if (!shutdown.signal.aborted) {
        console.error(error.message);
        process.exitCode = 1;
      }
    })
    .finally(() => {
      if (shutdown.signal.aborted) console.info('Render keep-alive stopped.');
    });
}
