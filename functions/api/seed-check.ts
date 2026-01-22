// Check if database needs to be reseeded (last seed > 24 hours ago)
type PagesFunction = (args: { env: any; request: Request }) => Promise<Response>;

type KVNamespace = {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
};

const LAST_SEED_CACHE_KEY = 'last-seed-timestamp';
const RESEED_INTERVAL_HOURS = 24;
const RESEED_INTERVAL_MS = RESEED_INTERVAL_HOURS * 60 * 60 * 1000;

export const onRequest: PagesFunction = async ({ env }) => {
  const kv = env.INSIGHTS_CACHE as KVNamespace | undefined;

  if (!kv) {
    // If KV is not available, assume we need to reseed
    return new Response(
      JSON.stringify({
        shouldReseed: true,
        reason: 'KV cache not available',
        lastSeedTime: null,
      }),
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      }
    );
  }

  try {
    const cached = await kv.get(LAST_SEED_CACHE_KEY, { type: 'json' });
    const now = Date.now();

    if (!cached) {
      // No seed timestamp found, need to reseed
      return new Response(
        JSON.stringify({
          shouldReseed: true,
          reason: 'No seed timestamp found in cache',
          lastSeedTime: null,
        }),
        {
          headers: {
            'content-type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    const seedData = cached as { timestamp: number };
    const lastSeedTime = seedData.timestamp;
    const timeSinceSeed = now - lastSeedTime;
    const shouldReseed = timeSinceSeed >= RESEED_INTERVAL_MS;

    return new Response(
      JSON.stringify({
        shouldReseed,
        reason: shouldReseed
          ? `Last seed was ${Math.round(timeSinceSeed / (60 * 60 * 1000))} hours ago (threshold: ${RESEED_INTERVAL_HOURS} hours)`
          : `Last seed was ${Math.round(timeSinceSeed / (60 * 60 * 1000))} hours ago (within ${RESEED_INTERVAL_HOURS} hour threshold)`,
        lastSeedTime,
        lastSeedTimeISO: new Date(lastSeedTime).toISOString(),
        hoursSinceSeed: Math.round((timeSinceSeed / (60 * 60 * 1000)) * 100) / 100,
      }),
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('[Seed Check] Error checking seed timestamp:', error);
    // On error, assume we need to reseed
    return new Response(
      JSON.stringify({
        shouldReseed: true,
        reason: `Error checking cache: ${error instanceof Error ? error.message : String(error)}`,
        lastSeedTime: null,
      }),
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      }
    );
  }
};
