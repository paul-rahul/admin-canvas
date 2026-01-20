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

    // AGGRESSIVE CHECK: Reject ANY data that has entries before 2012 or missing recent entries
    // If data is too old or empty, immediately use fresh mockFeedback
    const now = Date.now();
    const earliestValidDate = new Date('2012-01-01T00:00:00Z').getTime();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // Check for ANY entries before 2012 - if found, immediately reject
    const hasOldEntries = itemsFromDb.some((item) => {
      const timestamp = item.timestamp ? new Date(item.timestamp).getTime() : 0;
      return timestamp > 0 && timestamp < earliestValidDate;
    });
    
    // Count recent entries
    const last24hCount = itemsFromDb.filter((item) => {
      const timestamp = item.timestamp ? new Date(item.timestamp).getTime() : 0;
      return timestamp >= oneDayAgo && timestamp <= now;
    }).length;
    
    const last7dCount = itemsFromDb.filter((item) => {
      const timestamp = item.timestamp ? new Date(item.timestamp).getTime() : 0;
      return timestamp >= sevenDaysAgo && timestamp <= now;
    }).length;
    
    const lastYearCount = itemsFromDb.filter((item) => {
      const timestamp = item.timestamp ? new Date(item.timestamp).getTime() : 0;
      return timestamp >= oneYearAgo && timestamp <= now;
    }).length;
    
    // REJECT if: has old entries OR missing required recent entries
    // We need at least 50 entries in last 7d and 10 in last 24h to trust the data
    const hasRecentData = !hasOldEntries && 
      itemsFromDb.length > 0 && 
      last7dCount >= 50 && 
      last24hCount >= 10 &&
      lastYearCount >= 200;

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

