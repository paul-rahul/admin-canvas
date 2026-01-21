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
  const byUrgency: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const bySentiment: Record<string, number> = {};
  const byCustomerSegment: Record<string, number> = {};
  
  const negative = items.filter((item) => item.sentiment === 'negative').length;
  const bug = items.filter((item) => item.issueType === 'bug').length;
  const feature = items.filter((item) => item.issueType === 'feature').length;
  const critical = items.filter((item) => item.urgency === 'critical' && !item.resolved).length;
  const high = items.filter((item) => item.urgency === 'high' && !item.resolved).length;
  const unresolved = items.filter((item) => !item.resolved).length;
  const resolved = items.filter((item) => item.resolved).length;

  // Calculate time-based metrics
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const last7d = now - 7 * 24 * 60 * 60 * 1000;
  const recent24h = items.filter((item) => {
    const ts = new Date(item.createdAt || item.timestamp).getTime();
    return ts >= last24h;
  }).length;
  const recent7d = items.filter((item) => {
    const ts = new Date(item.createdAt || item.timestamp).getTime();
    return ts >= last7d;
  }).length;

  for (const item of items) {
    byIssueType[item.issueType] = (byIssueType[item.issueType] ?? 0) + 1;
    bySource[item.source] = (bySource[item.source] ?? 0) + 1;
    byUrgency[item.urgency] = (byUrgency[item.urgency] ?? 0) + 1;
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    bySentiment[item.sentiment] = (bySentiment[item.sentiment] ?? 0) + 1;
    byCustomerSegment[item.customerSegment] = (byCustomerSegment[item.customerSegment] ?? 0) + 1;
  }

  const topIssueType = Object.entries(byIssueType).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'bug';
  const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'support';
  const topUrgency = Object.entries(byUrgency).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'medium';
  const topCustomerSegment = Object.entries(byCustomerSegment).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';

  // Get sample titles for context
  const criticalTitles = items
    .filter((item) => item.urgency === 'critical' && !item.resolved)
    .slice(0, 5)
    .map((item) => item.title);
  
  const recentNegativeTitles = items
    .filter((item) => item.sentiment === 'negative')
    .sort((a, b) => {
      const aTs = new Date(a.createdAt || a.timestamp).getTime();
      const bTs = new Date(b.createdAt || b.timestamp).getTime();
      return bTs - aTs;
    })
    .slice(0, 5)
    .map((item) => item.title);

  return { 
    negative, 
    bug, 
    feature, 
    critical, 
    high,
    unresolved,
    resolved,
    topIssueType, 
    topSource,
    topUrgency,
    topCustomerSegment,
    recent24h,
    recent7d,
    byIssueType,
    bySource,
    byUrgency,
    byStatus,
    bySentiment,
    byCustomerSegment,
    criticalTitles,
    recentNegativeTitles,
  };
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
      {
        title: 'Resolution Status',
        content: `${counts.resolved} tickets resolved out of ${items.length} total. ${counts.unresolved} tickets remain open, including ${counts.high} high priority items.`,
        type: 'info',
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
  
  // Build detailed context for AI
  const issueTypeBreakdown = Object.entries(counts.byIssueType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ');
  
  const sourceBreakdown = Object.entries(counts.bySource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => `${source}: ${count}`)
    .join(', ');

  const urgencyBreakdown = Object.entries(counts.byUrgency)
    .map(([urgency, count]) => `${urgency}: ${count}`)
    .join(', ');

  const sentimentBreakdown = Object.entries(counts.bySentiment)
    .map(([sentiment, count]) => `${sentiment}: ${count}`)
    .join(', ');

  const customerBreakdown = Object.entries(counts.byCustomerSegment)
    .sort((a, b) => b[1] - a[1])
    .map(([segment, count]) => `${segment}: ${count}`)
    .join(', ');

  const prompt = `You are an expert product insights analyst for a SaaS platform. Analyze the following feedback data and provide actionable insights.

FEEDBACK SUMMARY:
- Total feedback entries: ${items.length}
- Recent activity: ${counts.recent24h} tickets in last 24 hours, ${counts.recent7d} tickets in last 7 days
- Unresolved tickets: ${counts.unresolved} (${counts.critical} critical, ${counts.high} high priority)
- Resolved tickets: ${counts.resolved}
- Sentiment distribution: ${sentimentBreakdown}
- Urgency distribution: ${urgencyBreakdown}
- Top issue types: ${issueTypeBreakdown}
- Top sources: ${sourceBreakdown}
- Customer segments: ${customerBreakdown}

CRITICAL ISSUES:
${counts.criticalTitles.length > 0 
  ? counts.criticalTitles.map((title, i) => `${i + 1}. ${title}`).join('\n')
  : 'No critical issues currently'}

RECENT NEGATIVE FEEDBACK:
${counts.recentNegativeTitles.length > 0
  ? counts.recentNegativeTitles.map((title, i) => `${i + 1}. ${title}`).join('\n')
  : 'No recent negative feedback'}

TASK: Generate exactly 4 concise, actionable insights that help product managers prioritize work and understand product health. Each insight should:
1. Be specific and data-driven
2. Highlight patterns, trends, or urgent issues
3. Provide actionable recommendations when possible
4. Use appropriate severity: "warning" for urgent issues, "info" for trends/patterns, "success" for opportunities

IMPORTANT: You must return exactly 4 insights. Do not return fewer or more than 4.

Return ONLY valid JSON in this exact format:
{
  "insights": [
    {
      "title": "Brief insight title (5-8 words)",
      "content": "Detailed explanation with specific numbers and actionable recommendations (1-2 sentences)",
      "type": "warning|info|success"
    },
    {
      "title": "Brief insight title (5-8 words)",
      "content": "Detailed explanation with specific numbers and actionable recommendations (1-2 sentences)",
      "type": "warning|info|success"
    },
    {
      "title": "Brief insight title (5-8 words)",
      "content": "Detailed explanation with specific numbers and actionable recommendations (1-2 sentences)",
      "type": "warning|info|success"
    },
    {
      "title": "Brief insight title (5-8 words)",
      "content": "Detailed explanation with specific numbers and actionable recommendations (1-2 sentences)",
      "type": "warning|info|success"
    }
  ],
  "summary": "One sentence overall summary of feedback health"
}

Important: Return ONLY the JSON object, no markdown, no code blocks, no explanations.`;

  try {
    const result = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { 
          role: 'system', 
          content: 'You are a product insights analyst. Always respond with valid JSON only. No markdown, no code blocks, no explanations before or after the JSON.' 
        },
        { role: 'user', content: prompt },
      ],
    });
    
    const text = result.response ?? result.result ?? '';
    console.log('[AI Insights] Response length:', text.length);
    console.log('[AI Insights] First 500 chars:', text.substring(0, 500));
    
    if (!text || text.trim().length === 0) {
      console.warn('[AI Insights] Empty response from AI');
      return defaultInsights(items);
    }
    
    const parsed = parseAiPayload(text);
    if (parsed?.insights?.length && Array.isArray(parsed.insights)) {
      // Validate and sanitize insights
      const validInsights = parsed.insights
        .filter((insight: any) => 
          insight && 
          typeof insight.title === 'string' && 
          typeof insight.content === 'string' && 
          ['warning', 'info', 'success'].includes(insight.type) &&
          insight.title.trim().length > 0 &&
          insight.content.trim().length > 0
        )
        .map((insight: any) => ({
          title: insight.title.trim(),
          content: insight.content.trim(),
          type: insight.type as 'warning' | 'info' | 'success',
        }));
      
      if (validInsights.length > 0) {
        console.log(`[AI Insights] Generated ${validInsights.length} valid insights`);
        // Ensure we have exactly 4 insights (pad with defaults if needed, or trim if more)
        let finalInsights = validInsights;
        if (validInsights.length < 4) {
          console.warn(`[AI Insights] Only ${validInsights.length} insights received, padding to 4`);
          const defaultResult = defaultInsights(items);
          finalInsights = [...validInsights, ...defaultResult.insights.slice(validInsights.length, 4)];
        } else if (validInsights.length > 4) {
          console.warn(`[AI Insights] ${validInsights.length} insights received, trimming to 4`);
          finalInsights = validInsights.slice(0, 4);
        }
        return {
          insights: finalInsights,
          summary: parsed.summary?.trim() || defaultInsights(items).summary,
        };
      } else {
        console.warn('[AI Insights] No valid insights found in parsed response');
      }
    } else {
      console.warn('[AI Insights] Failed to parse AI response or no insights array found');
    }
  } catch (error) {
    console.error('[AI Insights] Error calling Workers AI:', error);
    // Return default insights on error
    return defaultInsights(items);
  }

  return defaultInsights(items);
};

export const onRequest: PagesFunction = async ({ env }) => {
  try {
    const db = env.ANALYTICS_DB as D1Database;

    let items: FeedbackApiItem[] = [];
    
    if (db) {
      try {
        const { results } = await db
          .prepare('SELECT payload FROM feedback_entries')
          .all<{ payload: string }>();

        items = (results?.map((row) => JSON.parse(row.payload)) ??
          []) as FeedbackApiItem[];
      } catch (dbError) {
        console.error('[AI Insights] D1 query error:', dbError);
        // Continue with empty items, will fall back to mock data
      }
    }

    // Fallback to mock data if DB is empty or unavailable
    const sourceItems =
      items.length > 0 ? items : serializeFeedback(mockFeedback);

    console.log(`[AI Insights] Processing ${sourceItems.length} feedback items`);
    console.log(`[AI Insights] AI binding available: ${!!env.AI}`);

    const insights = await buildInsights(env.AI as AiBinding | undefined, sourceItems);

    return new Response(JSON.stringify(insights), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[AI Insights] Fatal error:', error);
    // Return default insights even on fatal errors
    const defaultResult = defaultInsights(serializeFeedback(mockFeedback));
    return new Response(JSON.stringify(defaultResult), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
      status: 200, // Return 200 even on error to show fallback insights
    });
  }
};
