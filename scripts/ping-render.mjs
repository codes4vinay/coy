import { setTimeout as delay } from 'node:timers/promises';

const healthUrl = process.env.RENDER_HEALTH_URL || 'https://coy-9vf6.onrender.com/health';
const attempts = 3;
const timeoutMs = 75_000;

async function pingRender() {
  const endpoint = new URL(healthUrl);
  if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) {
    throw new Error('Use an HTTP(S) health URL without embedded credentials.');
  }

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const started = Date.now();
    try {
      // Run externally: an interval inside Render cannot wake an already sleeping process.
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json', 'User-Agent': 'Coy-Discover-Health-Check' },
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) throw new Error(`Health endpoint returned HTTP ${response.status}.`);
      const health = await response.json().catch(() => null);
      if (health?.success !== true)
        throw new Error('API did not report a healthy database connection.');
      console.info(`Render health check passed in ${Date.now() - started}ms (attempt ${attempt}).`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown connection error.';
      console.error(`Health check ${attempt}/${attempts} failed: ${message}`);
      if (attempt === attempts)
        throw new Error('Render did not become healthy after three attempts.');
      // Allow an initial cold start or deployment restart to recover before the next check.
      await delay(5000);
    }
  }
}

pingRender().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
