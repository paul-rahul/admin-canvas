import { buildMockFeedback, buildFeedbackWithDates } from '../../src/data/mockFeedback';

type FeedbackApiItem = Omit<ReturnType<typeof buildMockFeedback>[number], 'timestamp'> & { timestamp: string };

type KVNamespace = {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
};

const serializeFeedback = (items: ReturnType<typeof buildMockFeedback>): FeedbackApiItem[] =>
  items.map((item) => ({
    ...item,
    timestamp: item.createdAt, // createdAt is already ISO string
  }));

const LAST_SEED_CACHE_KEY = 'last-seed-timestamp';

export const onRequest: PagesFunction = async ({ env }) => {
  const db = env.ANALYTICS_DB as D1Database;
  const kv = env.INSIGHTS_CACHE as KVNamespace | undefined;
  
  // Generate fresh mock feedback with current dates
  console.log('[Seed] Generating fresh mock feedback with current dates...');
  const freshMockFeedback = buildMockFeedback();
  const items = serializeFeedback(freshMockFeedback);
  console.log(`[Seed] Generated ${items.length} fresh feedback entries`);

  const stmt = db.prepare(
    'INSERT OR REPLACE INTO feedback_entries (id, payload) VALUES (?1, ?2)'
  );

  const batch = db.batch(
    items.map((item) => stmt.bind(item.id, JSON.stringify(item)))
  );

  await batch;

  // Store the seed timestamp in KV cache
  const seedTimestamp = Date.now();
  if (kv) {
    try {
      await kv.put(LAST_SEED_CACHE_KEY, JSON.stringify({ timestamp: seedTimestamp }), {
        expirationTtl: 7 * 24 * 60 * 60, // 7 days TTL (longer than 24h check)
      });
      console.log('[Seed] Stored last seed timestamp in cache:', new Date(seedTimestamp).toISOString());
    } catch (error) {
      console.warn('[Seed] Failed to store seed timestamp in cache:', error);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      count: items.length,
      seedTimestamp,
      seedTime: new Date(seedTimestamp).toISOString(),
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
};

