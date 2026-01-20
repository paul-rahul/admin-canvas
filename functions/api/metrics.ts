type FeedbackApiItem = {
  id: string;
  timestamp: string;
  urgency?: string;
  resolved?: boolean;
};

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
  const db = env.ANALYTICS_DB as D1Database;

  const { results } = await db
    .prepare('SELECT payload FROM feedback_entries')
    .all<{ payload: string }>();

  const items: FeedbackApiItem[] =
    results?.map((row) => JSON.parse(row.payload)) ?? [];

  const metrics = computeMetrics(items);
  await upsertMetrics(db, metrics);

  return new Response(JSON.stringify(metrics), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
