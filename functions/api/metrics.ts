import { mockFeedback, FeedbackItem } from '../../src/data/mockFeedback';

type FeedbackApiItem = Omit<FeedbackItem, 'timestamp'> & { timestamp: string };

const serializeFeedback = (items: FeedbackItem[]): FeedbackApiItem[] =>
  items.map((item) => ({
    ...item,
    timestamp: item.timestamp.toISOString(),
  }));

const computeMetrics = (items: FeedbackApiItem[]) => {
  const total = items.length;
  const critical = items.filter((item) => item.urgency === 'critical' && !item.resolved).length;
  const resolved = items.filter((item) => item.resolved).length;
  const avgResponseTime = '2.4h';

  return { total, critical, resolved, avgResponseTime };
};

const upsertMetrics = async (db: D1Database, metrics: ReturnType<typeof computeMetrics>) => {
  await db
    .prepare(
      `INSERT OR REPLACE INTO feedback_metrics 
        (id, total, critical, resolved, avg_response_time, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      'current',
      metrics.total,
      metrics.critical,
      metrics.resolved,
      metrics.avgResponseTime,
      new Date().toISOString()
    )
    .run();
};

export const onRequest: PagesFunction = async ({ env }) => {
  try {
    const db = (env as unknown as { ANALYTICS_DB?: D1Database }).ANALYTICS_DB;

    let items: FeedbackApiItem[];

    if (db) {
      const { results } = await db
        .prepare('SELECT payload FROM feedback_entries')
        .all<{ payload: string }>();

      const itemsFromDb: FeedbackApiItem[] =
        results?.map((row) => JSON.parse(row.payload)) ?? [];

      // Use same aggressive check as feedback endpoint
      const now = Date.now();
      const earliestValidDate = new Date('2012-01-01T00:00:00Z').getTime();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      
      const hasOldEntries = itemsFromDb.some((item) => {
        const timestamp = item.timestamp ? new Date(item.timestamp).getTime() : 0;
        return timestamp > 0 && timestamp < earliestValidDate;
      });
      
      const last24hCount = itemsFromDb.filter((item) => {
        const timestamp = item.timestamp ? new Date(item.timestamp).getTime() : 0;
        return timestamp >= oneDayAgo && timestamp <= now;
      }).length;
      
      const last7dCount = itemsFromDb.filter((item) => {
        const timestamp = item.timestamp ? new Date(item.timestamp).getTime() : 0;
        return timestamp >= sevenDaysAgo && timestamp <= now;
      }).length;
      
      const hasRecentData = !hasOldEntries && 
        itemsFromDb.length > 0 && 
        last7dCount >= 50 && 
        last24hCount >= 10;

      items = hasRecentData ? itemsFromDb : serializeFeedback(mockFeedback);
    } else {
      items = serializeFeedback(mockFeedback);
    }

    const metrics = computeMetrics(items);

    if (db) {
      await upsertMetrics(db, metrics);
    }

    return new Response(JSON.stringify(metrics), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch {
    const fallbackMetrics = computeMetrics(serializeFeedback(mockFeedback));

    return new Response(JSON.stringify(fallbackMetrics), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }
};

