type FeedbackApiItem = {
  id: string;
  timestamp: string;
  [key: string]: unknown;
};

export const onRequest: PagesFunction = async ({ env }) => {
  const db = env.ANALYTICS_DB as D1Database;

  const { results } = await db
    .prepare('SELECT payload FROM feedback_entries')
    .all<{ payload: string }>();

  const items: FeedbackApiItem[] =
    results?.map((row) => JSON.parse(row.payload)) ?? [];

  return new Response(JSON.stringify(items), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
