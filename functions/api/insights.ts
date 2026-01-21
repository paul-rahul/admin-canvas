import { mockFeedback, FeedbackItem } from '../../src/data/mockFeedback';

// Cloudflare Pages Function types
type PagesFunction = (args: { env: any; request: Request }) => Promise<Response>;
type D1Database = any;

// Cloudflare Workers AI response structure
// According to docs: chat models return { response: string }
type AiBinding = {
  run: (
    model: string,
    options: {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    }
  ) => Promise<{ 
    response?: string;  // Primary response text
    [key: string]: any; // Allow other properties
  }>;
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
  try {
    if (!text || typeof text !== 'string') {
      console.warn('[AI Insights] Invalid text input for parsing:', typeof text);
      return null;
    }
    
    // Strategy 1: Try parsing directly first (AI returns clean JSON string)
    let cleaned = text.trim();
    
    // Strategy 2: Remove markdown code blocks if present
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    
    // Strategy 3: Extract JSON object from text (in case there's extra text)
    const start = cleaned.indexOf('{');
    let end = cleaned.lastIndexOf('}');
    
    if (start === -1) {
      console.warn('[AI Insights] No opening brace found in response');
      console.warn('[AI Insights] Response text (first 1000 chars):', text.substring(0, 1000));
      return null;
    }
    
    // If no closing brace found, the JSON is incomplete - try to find where it cuts off
    if (end === -1 || end <= start) {
      console.warn('[AI Insights] No closing brace found - JSON appears incomplete');
      console.warn('[AI Insights] Response text (first 1000 chars):', text.substring(0, 1000));
      console.warn('[AI Insights] Response text (last 200 chars):', text.substring(Math.max(0, text.length - 200)));
      return null;
    }
    
    const jsonStr = cleaned.slice(start, end + 1);
    console.log('[AI Insights] Extracted JSON string length:', jsonStr.length);
    console.log('[AI Insights] First 300 chars:', jsonStr.substring(0, 300));
    console.log('[AI Insights] Last 200 chars:', jsonStr.substring(Math.max(0, jsonStr.length - 200)));
    
    // Check for balanced braces before parsing
    const openBraces = (jsonStr.match(/\{/g) || []).length;
    const closeBraces = (jsonStr.match(/\}/g) || []).length;
    console.log('[AI Insights] Open braces:', openBraces, 'Close braces:', closeBraces);
    
    if (openBraces !== closeBraces) {
      console.error('[AI Insights] Unbalanced braces detected! JSON is incomplete.');
      console.error('[AI Insights] Missing', Math.abs(openBraces - closeBraces), 'closing brace(s)');
      console.error('[AI Insights] Full JSON string:', jsonStr);
      return null; // Don't try to parse incomplete JSON
    }
    
    // Strategy 4: Try to parse
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      // If parsing fails, check if it's a syntax error due to incomplete JSON
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      console.error('[AI Insights] JSON.parse failed:', errorMsg);
      
      // Check if error indicates incomplete JSON
      if (errorMsg.includes('Unexpected end') || errorMsg.includes('end of data')) {
        console.error('[AI Insights] JSON appears to be incomplete/truncated');
        console.error('[AI Insights] Full JSON string:', jsonStr);
      }
      
      throw parseError; // Re-throw to be caught by outer catch
    }
    
    // Type check and validate
    const typedParsed = parsed as {
      insights?: Array<{ title?: string; content?: string; type?: string }>;
      summary?: string;
    };
    
    console.log('[AI Insights] Successfully parsed JSON. Has insights:', !!typedParsed?.insights);
    console.log('[AI Insights] Insights count:', typedParsed?.insights?.length || 0);
    
    // Validate structure
    if (!typedParsed || !typedParsed.insights || !Array.isArray(typedParsed.insights)) {
      console.warn('[AI Insights] Invalid insights structure in parsed response');
      console.warn('[AI Insights] Parsed object keys:', Object.keys(typedParsed || {}));
      console.warn('[AI Insights] Parsed object:', JSON.stringify(typedParsed).substring(0, 1000));
      return null;
    }
    
    return typedParsed as {
      insights: Array<{ title: string; content: string; type: 'warning' | 'info' | 'success' }>;
      summary?: string;
    };
  } catch (error) {
    console.error('[AI Insights] JSON parse error:', error);
    console.error('[AI Insights] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[AI Insights] Error name:', error instanceof Error ? error.name : typeof error);
    
    // Log more context about the text
    console.error('[AI Insights] Text length:', text.length);
    console.error('[AI Insights] First 500 chars:', text.substring(0, 500));
    console.error('[AI Insights] Last 200 chars:', text.substring(Math.max(0, text.length - 200)));
    
    // Check if JSON is incomplete (common issue)
    const openBraces = (text.match(/\{/g) || []).length;
    const closeBraces = (text.match(/\}/g) || []).length;
    console.error('[AI Insights] Open braces count:', openBraces);
    console.error('[AI Insights] Close braces count:', closeBraces);
    console.error('[AI Insights] Brace mismatch:', openBraces !== closeBraces);
    
    return null;
  }
};

const buildInsights = async (ai: AiBinding | undefined, items: FeedbackApiItem[]) => {
  if (!ai) {
    console.warn('[AI Insights] AI binding is undefined - binding not configured or not available');
    const defaultResult = defaultInsights(items);
    return { ...defaultResult, source: 'fallback', aiAvailable: false };
  }
  
  console.log('[AI Insights] AI binding is available, attempting to call Workers AI');

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

CRITICAL: You MUST return ONLY valid JSON. No markdown, no code blocks, no explanations, no text before or after the JSON.

Return ONLY this JSON structure (replace placeholders with actual values):
{
  "insights": [
    {
      "title": "Brief insight title",
      "content": "Detailed explanation with numbers",
      "type": "warning"
    },
    {
      "title": "Brief insight title",
      "content": "Detailed explanation with numbers",
      "type": "info"
    },
    {
      "title": "Brief insight title",
      "content": "Detailed explanation with numbers",
      "type": "success"
    },
    {
      "title": "Brief insight title",
      "content": "Detailed explanation with numbers",
      "type": "warning"
    }
  ],
  "summary": "One sentence summary"
}

Remember: Return ONLY the JSON object, nothing else.`;

  try {
    const result = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { 
          role: 'system', 
          content: 'You are a JSON API. Return ONLY valid JSON. Keep it SHORT. No markdown, no explanations, no text outside JSON. Must be complete JSON.' 
        },
        { role: 'user', content: prompt },
      ],
    });
    
    // Log the full result structure for debugging
    console.log('[AI Insights] Full result object:', JSON.stringify(result).substring(0, 1000));
    console.log('[AI Insights] Result object keys:', Object.keys(result));
    console.log('[AI Insights] Result type:', typeof result);
    
    // According to Cloudflare Workers AI docs, chat models return { response: string }
    // The debug endpoint confirmed: result.response contains the JSON string
    let textStr = '';
    if (result && typeof result === 'object') {
      // Primary: Use response property (confirmed by debug endpoint)
      textStr = (result as any).response ?? '';
      
      // Fallback to other properties if response doesn't exist
      if (!textStr) {
        textStr = (result as any).text ?? 
                  (result as any).result ?? 
                  (result as any).output ?? 
                  (result as any).content ?? 
                  '';
      }
      
      // If result itself is a string (some models return string directly)
      if (!textStr && typeof result === 'string') {
        textStr = result;
      }
      
      // If result has a data property
      if (!textStr && (result as any).data) {
        textStr = String((result as any).data);
      }
    } else if (typeof result === 'string') {
      textStr = result;
    }
    
    textStr = String(textStr || '').trim();
    console.log('[AI Insights] Extracted text length:', textStr.length);
    console.log('[AI Insights] First 500 chars:', textStr.substring(0, 500));
    console.log('[AI Insights] Last 200 chars:', textStr.substring(Math.max(0, textStr.length - 200)));
    
    // If we still don't have text, log the entire result structure
    if (!textStr || textStr.length === 0) {
      console.error('[AI Insights] No text extracted from result. Full result:', JSON.stringify(result, null, 2));
    }
    
    if (!textStr || textStr.trim().length === 0) {
      console.warn('[AI Insights] Empty response from AI');
      const defaultResult = defaultInsights(items);
      return { ...defaultResult, source: 'fallback', aiAvailable: true, aiError: 'Empty response from AI' };
    }
    
    // Log the full response before parsing
    console.log('[AI Insights] Full response text length:', textStr.length);
    console.log('[AI Insights] Full response text:', textStr);
    
    const parsed = parseAiPayload(textStr);
    console.log('[AI Insights] Parse result:', parsed ? 'SUCCESS' : 'FAILED');
    
    if (parsed?.insights?.length && Array.isArray(parsed.insights)) {
      // Validate and sanitize insights with more lenient type handling
      const validInsights = parsed.insights
        .filter((insight: any) => {
          if (!insight || typeof insight !== 'object') return false;
          if (typeof insight.title !== 'string' || insight.title.trim().length === 0) return false;
          if (typeof insight.content !== 'string' || insight.content.trim().length === 0) return false;
          return true; // Accept any type, we'll normalize it below
        })
        .map((insight: any): { title: string; content: string; type: 'warning' | 'info' | 'success' } => {
          // Normalize the type field
          let normalizedType: 'warning' | 'info' | 'success' = 'info';
          const typeStr = String(insight.type || '').toLowerCase();
          if (typeStr.includes('warn') || typeStr.includes('critical') || typeStr.includes('urgent') || typeStr === 'warning') {
            normalizedType = 'warning';
          } else if (typeStr.includes('success') || typeStr.includes('opportunity') || typeStr.includes('positive') || typeStr === 'success') {
            normalizedType = 'success';
          } else {
            normalizedType = 'info'; // Default
          }
          
          return {
            title: String(insight.title).trim(),
            content: String(insight.content).trim(),
            type: normalizedType,
          };
        });
      
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
          source: 'ai',
          aiAvailable: true,
        };
      } else {
        console.warn('[AI Insights] No valid insights found in parsed response');
        const defaultResult = defaultInsights(items);
        return { 
          ...defaultResult, 
          source: 'fallback', 
          aiAvailable: true, 
          aiError: 'No valid insights in AI response',
          debugInfo: { rawText: textStr.substring(0, 500) }
        };
      }
    } else {
      console.warn('[AI Insights] Failed to parse AI response or no insights array found');
      console.warn('[AI Insights] Raw text that failed to parse:', textStr.substring(0, 5000));
      const defaultResult = defaultInsights(items);
      return { 
        ...defaultResult, 
        source: 'fallback', 
        aiAvailable: true, 
        aiError: `Failed to parse AI response as JSON. Raw response preview: ${textStr.substring(0, 200)}...`,
        debugInfo: { 
          rawText: textStr.substring(0, 1000),
          rawTextLength: textStr.length,
          hasJsonStart: textStr.includes('{'),
          hasJsonEnd: textStr.includes('}'),
        }
      };
    }
  } catch (error) {
    console.error('[AI Insights] Error calling Workers AI:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const defaultResult = defaultInsights(items);
    return { ...defaultResult, source: 'fallback', aiAvailable: true, aiError: errorMessage };
  }

  const defaultResult = defaultInsights(items);
  return { ...defaultResult, source: 'fallback', aiAvailable: true };
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
    console.log(`[AI Insights] AI binding type: ${typeof env.AI}`);
    console.log(`[AI Insights] All env keys: ${Object.keys(env).join(', ')}`);
    if (env.AI) {
      console.log(`[AI Insights] AI binding has run method: ${typeof (env.AI as any).run === 'function'}`);
      console.log(`[AI Insights] AI binding methods: ${Object.keys(env.AI).join(', ')}`);
    } else {
      console.error('[AI Insights] CRITICAL: env.AI is undefined! AI binding not configured.');
      console.error('[AI Insights] For Cloudflare Pages, AI bindings must be configured in Dashboard:');
      console.error('[AI Insights] Pages > admin-canvas > Settings > Functions > Bindings > Add > Workers AI');
      console.error('[AI Insights] Set variable name to "AI" to match env.AI in code');
    }

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
    return new Response(JSON.stringify({ ...defaultResult, source: 'fallback', aiAvailable: false, aiError: 'Fatal error' }), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
      status: 200, // Return 200 even on error to show fallback insights
    });
  }
};
