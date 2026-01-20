import { mockFeedback } from '../../src/data/mockFeedback';

type FeedbackApiItem = Omit<(typeof mockFeedback)[number], 'timestamp'> & { timestamp: string };

const serializeFeedback = (): FeedbackApiItem[] =>
  mockFeedback.map((item) => ({
    ...item,
    timestamp: item.timestamp.toISOString(),
  }));

export const onRequest: PagesFunction = async ({ env }) => {
  const db = env.ANALYTICS_DB as D1Database;
  const items = serializeFeedback();

  const stmt = db.prepare(
    'INSERT OR REPLACE INTO feedback_entries (id, payload) VALUES (?1, ?2)'
  );

  const batch = db.batch(
    items.map((item) => stmt.bind(item.id, JSON.stringify(item)))
  );

  await batch;

  return new Response(
    JSON.stringify({
      ok: true,
      count: items.length,
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
};

