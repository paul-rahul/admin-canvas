import { buildMockFeedback, buildFeedbackWithDates, FeedbackItem } from '../../src/data/mockFeedback';

type FeedbackApiItem = Omit<FeedbackItem, 'timestamp'> & {
  timestamp: string;
};

const serializeFeedback = (): FeedbackApiItem[] => {
  // Generate fresh data at runtime to ensure we always use the latest generation logic
  const rawItems = buildMockFeedback();
  const itemsWithDates = buildFeedbackWithDates(rawItems);
  return itemsWithDates.map((item) => ({
    ...item,
    timestamp: item.timestamp.toISOString(),
  }));
};

export const onRequest: PagesFunction = async ({ env }) => {
  try {
    const db = (env as unknown as { ANALYTICS_DB?: D1Database }).ANALYTICS_DB;
    if (!db) {
      throw new Error('ANALYTICS_DB binding is missing');
    }

    // Clear old data first to ensure fresh seed
    await db.prepare('DELETE FROM feedback_entries').run();

    const items = serializeFeedback();

    // Use D1 batch() method with smaller batches to avoid rate limits
    // D1 allows up to 50 statements per batch, so we'll use 40 to be safe
    const batchSize = 40;
    let inserted = 0;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Use D1's batch() method which executes all statements in a single transaction
      const statements = batch.map((item) =>
        db.prepare('INSERT OR REPLACE INTO feedback_entries (id, payload) VALUES (?1, ?2)')
          .bind(item.id, JSON.stringify(item))
      );
      
      await db.batch(statements);
      inserted += batch.length;
      
      // Add a small delay between batches to avoid rate limiting
      // Only delay every 10 batches to speed things up
      if ((i / batchSize) % 10 === 0 && i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay every 10 batches
      }
    }

    // Verify the data was inserted
    const verifyResult = await db
      .prepare('SELECT COUNT(*) as count FROM feedback_entries')
      .first<{ count: number }>();

    const verifiedCount = verifyResult?.count ?? 0;

    // Sample entries to verify dates - get min and max dates
    const allResults = await db
      .prepare('SELECT payload FROM feedback_entries')
      .all<{ payload: string }>();
    
    const allDates = allResults?.results?.map((row) => {
      const item = JSON.parse(row.payload);
      return new Date(item.createdAt || item.timestamp).getTime();
    }) || [];
    
    const minDate = allDates.length > 0 ? new Date(Math.min(...allDates)).toISOString() : 'N/A';
    const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString() : 'N/A';
    
    // Count entries in last year
    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const lastYearCount = allDates.filter(ts => ts >= oneYearAgo).length;

    return new Response(
      JSON.stringify({
        ok: true,
        count: inserted,
        verified: verifiedCount,
        source: 'mockFeedback',
        message: `Successfully seeded ${inserted} entries with 14-year date distribution (2012-2026). Verified: ${verifiedCount} entries in database.`,
        dateRange: {
          earliest: minDate,
          latest: maxDate,
          lastYearCount,
        },
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


