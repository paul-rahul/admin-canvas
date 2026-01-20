import { mockFeedback } from '../../src/data/mockFeedback';

type FeedbackApiItem = Omit<(typeof mockFeedback)[number], 'timestamp'> & {
  timestamp: string;
};

const serializeFeedback = (): FeedbackApiItem[] =>
  mockFeedback.map((item) => ({
    ...item,
    timestamp: item.timestamp.toISOString(),
  }));

export const onRequest: PagesFunction = async ({ env }) => {
  try {
    const db = (env as unknown as { ANALYTICS_DB?: D1Database }).ANALYTICS_DB;
    if (!db) {
      throw new Error('ANALYTICS_DB binding is missing');
    }

    // Clear old data first to ensure fresh seed
    await db.prepare('DELETE FROM feedback_entries').run();

    const items = serializeFeedback();

    // Use batch inserts for better performance
    const stmt = db.prepare(
      'INSERT INTO feedback_entries (id, payload) VALUES (?1, ?2)'
    );

    // Process in batches of 100 to avoid hitting D1 limits
    const batchSize = 100;
    let inserted = 0;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map((item) => 
        db.prepare('INSERT OR REPLACE INTO feedback_entries (id, payload) VALUES (?1, ?2)')
          .bind(item.id, JSON.stringify(item))
          .run()
      );
      await Promise.all(batchPromises);
      inserted += batch.length;
    }

    // Verify the data was inserted
    const verifyResult = await db
      .prepare('SELECT COUNT(*) as count FROM feedback_entries')
      .first<{ count: number }>();

    const verifiedCount = verifyResult?.count ?? 0;

    // Sample a few entries to verify dates
    const sampleResult = await db
      .prepare('SELECT payload FROM feedback_entries LIMIT 5')
      .all<{ payload: string }>();
    
    const sampleDates = sampleResult?.results?.map((row) => {
      const item = JSON.parse(row.payload);
      return item.createdAt || item.timestamp;
    }) || [];

    return new Response(
      JSON.stringify({
        ok: true,
        count: inserted,
        verified: verifiedCount,
        source: 'mockFeedback',
        message: `Successfully seeded ${inserted} entries with 14-year date distribution (2012-2026). Verified: ${verifiedCount} entries in database.`,
        sampleDates,
      }),
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: (error as Error).message ?? String(error),
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      }
    );
  }
};


