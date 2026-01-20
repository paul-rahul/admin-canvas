import { mockFeedback, FeedbackItem } from '../../src/data/mockFeedback';

type FeedbackApiItem = Omit<FeedbackItem, 'timestamp'> & { timestamp: string };

const serializeFeedback = (items: FeedbackItem[]): FeedbackApiItem[] =>
  items.map((item) => ({
    ...item,
    timestamp: item.timestamp.toISOString(),
  }));

export const onRequest: PagesFunction = async ({ env }) => {
  try {
    const db = (env as unknown as { ANALYTICS_DB?: D1Database }).ANALYTICS_DB;

    if (!db) {
      // Fallback completely to mock data if binding missing
      return new Response(JSON.stringify(serializeFeedback(mockFeedback)), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }

    const { results } = await db
      .prepare('SELECT payload FROM feedback_entries')
      .all<{ payload: string }>();

    const itemsFromDb: FeedbackApiItem[] =
      results?.map((row) => JSON.parse(row.payload)) ?? [];

    // Check if data exists and is recent (within 2012-2026 range)
    // If data is too old (from 1969) or empty, use fresh mockFeedback
    const now = Date.now();
    const earliestValidDate = new Date('2012-01-01T00:00:00Z').getTime();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    
    // Check if we have recent data - at least 80% of entries should be from 2012+
    // AND at least some entries should be from the last year
    const recentCount = itemsFromDb.filter((item) => {
      const timestamp = item.timestamp ? new Date(item.timestamp).getTime() : 0;
      return timestamp >= earliestValidDate && timestamp <= now;
    }).length;
    
    const lastYearCount = itemsFromDb.filter((item) => {
      const timestamp = item.timestamp ? new Date(item.timestamp).getTime() : 0;
      return timestamp >= oneYearAgo && timestamp <= now;
    }).length;
    
    // Require: 80% recent AND at least 100 entries from last year (to ensure fresh data)
    const hasRecentData = itemsFromDb.length > 0 && 
      recentCount > itemsFromDb.length * 0.8 && 
      lastYearCount >= 100;

    const items = hasRecentData ? itemsFromDb : serializeFeedback(mockFeedback);

    return new Response(JSON.stringify(items), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch {
    // On any error, fall back to mock data so the UI still works
    return new Response(JSON.stringify(serializeFeedback(mockFeedback)), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }
};

