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
        source: 'mockFeedback',
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


