import { setTimeout as delay } from 'node:timers/promises';

const healthUrl = process.env.RENDER_HEALTH_URL || 'https://coy-9vf6.onrender.com/health';
const attempts = 3;
const timeoutMs = 75_000;
const intervalMs = 14 * 60 * 1000;
const runOnce = process.argv.includes('--once');
const shutdown = new AbortController();

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => shutdown.abort());
}

async function pingRender(endpoint) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const started = Date.now();
    try {
      // Run externally: an interval inside Render cannot wake an already sleeping process.
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json', 'User-Agent': 'Coy-Discover-Health-Check' },
        cache: 'no-store',
        signal: AbortSignal.any([shutdown.signal, AbortSignal.timeout(timeoutMs)]),
      });
      if (!response.ok) throw new Error(`Health endpoint returned HTTP ${response.status}.`);
      const health = await response.json().catch(() => null);
      if (health?.success !== true)
        throw new Error('API did not report a healthy database connection.');
      console.info(`Render health check passed in ${Date.now() - started}ms (attempt ${attempt}).`);
      return;
    } catch (error) {
      if (shutdown.signal.aborted) return;
      const message = error instanceof Error ? error.message : 'Unknown connection error.';
      console.error(`Health check ${attempt}/${attempts} failed: ${message}`);
      if (attempt === attempts)
        throw new Error('Render did not become healthy after three attempts.');
      // Allow an initial cold start or deployment restart to recover before the next check.
      await delay(5000, undefined, { signal: shutdown.signal });
    }
  }
}

async function main() {
  const endpoint = new URL(healthUrl);
  if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) {
    throw new Error('Use an HTTP(S) health URL without embedded credentials.');
  }

  if (runOnce) {
    await pingRender(endpoint);
    return;
  }

  console.info(
    'Render keep-alive started. Pinging now, then every 14 minutes. Press Ctrl+C to stop.',
  );
  while (!shutdown.signal.aborted) {
    const started = Date.now();
    try {
      await pingRender(endpoint);
    } catch (error) {
      if (shutdown.signal.aborted) break;
      // A temporary outage must not terminate the recurring process.
      console.error(error instanceof Error ? error.message : 'Health check failed.');
    }
    if (shutdown.signal.aborted) break;
    // Schedule from the request's start, so response time does not stretch the 14-minute interval.
    const waitMs = Math.max(0, intervalMs - (Date.now() - started));
    console.info(`Next health check in ${Math.ceil(waitMs / 60_000)} minutes.`);
    await delay(waitMs, undefined, { signal: shutdown.signal });
  }
}

main()
  .catch((error) => {
    if (!shutdown.signal.aborted) {
      console.error(error.message);
      process.exitCode = 1;
    }
  })
  .finally(() => {
    if (shutdown.signal.aborted) console.info('Render keep-alive stopped.');
  });
