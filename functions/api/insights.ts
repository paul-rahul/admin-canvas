import { mockFeedback, FeedbackItem } from '../../src/data/mockFeedback';

type AiBinding = {
  run: (
    model: string,
    options: {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    }
  ) => Promise<{ response?: string; result?: string }>;
};

type FeedbackApiItem = Omit<FeedbackItem, 'timestamp'> & { timestamp: string };

const serializeFeedback = (items: FeedbackItem[]): FeedbackApiItem[] =>
  items.map((item) => ({
    ...item,
    timestamp: item.timestamp.toISOString(),
  }));

const computeCounts = (items: FeedbackApiItem[]) => {
  const byIssueType: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const negative = items.filter((item) => item.sentiment === 'negative').length;
  const bug = items.filter((item) => item.issueType === 'bug').length;
  const feature = items.filter((item) => item.issueType === 'feature').length;
  const critical = items.filter((item) => item.urgency === 'critical' && !item.resolved).length;

  for (const item of items) {
    byIssueType[item.issueType] = (byIssueType[item.issueType] ?? 0) + 1;
    bySource[item.source] = (bySource[item.source] ?? 0) + 1;
  }

  const topIssueType = Object.entries(byIssueType).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'bug';
  const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'support';

  return { negative, bug, feature, critical, topIssueType, topSource };
};

const defaultInsights = (items: FeedbackApiItem[]) => {
  const counts = computeCounts(items);
  return {
    insights: [
      {
        title: 'Critical Issues',
        content: `${counts.critical} unresolved critical tickets require immediate attention.`,
        type: 'warning',
      },
      {
        title: 'Trending Topics',
        content: `Most feedback clusters around ${counts.topIssueType} and originates from ${counts.topSource}.`,
        type: 'info',
      },
      {
        title: 'Feature Opportunities',
        content: `${counts.feature} feature requests are queued with ${counts.bug} bug reports in the backlog.`,
        type: 'success',
      },
    ],
    summary: `${counts.negative} negative reports flagged across ${items.length} total feedback entries.`,
  };
};

const parseAiPayload = (text: string) => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as {
      insights: Array<{ title: string; content: string; type: 'warning' | 'info' | 'success' }>;
      summary?: string;
    };
  } catch (error) {
    return null;
  }
};

const buildInsights = async (ai: AiBinding | undefined, items: FeedbackApiItem[]) => {
  if (!ai) {
    return defaultInsights(items);
  }

  const counts = computeCounts(items);
  const prompt = [
    `You are a product insights analyst.`,
    `Create 3 concise insights from this feedback snapshot.`,
    `Return JSON with keys: insights (array of {title, content, type}) and summary.`,
    `Type must be one of: warning, info, success.`,
    `Counts: total=${items.length}, critical=${counts.critical}, negative=${counts.negative}, bug=${counts.bug}, feature=${counts.feature}, topIssueType=${counts.topIssueType}, topSource=${counts.topSource}.`,
  ].join(' ');

  try {
    const result = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: 'Respond only with JSON. No extra text.' },
        { role: 'user', content: prompt },
      ],
    });
    const text = result.response ?? result.result ?? '';
    const parsed = parseAiPayload(text);
    if (parsed?.insights?.length) {
      return parsed;
    }
  } catch (error) {
    return defaultInsights(items);
  }

  return defaultInsights(items);
};

export const onRequest: PagesFunction = async ({ env }) => {
  const items = serializeFeedback(mockFeedback);
  const insights = await buildInsights(env.AI, items);

  return new Response(JSON.stringify(insights), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
