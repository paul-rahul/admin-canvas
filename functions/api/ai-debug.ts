import { mockFeedback, FeedbackItem } from '../../src/data/mockFeedback';

type AiBinding = {
  run: (
    model: string,
    options: {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    }
  ) => Promise<{ 
    response?: string;
    [key: string]: any;
  }>;
};

type FeedbackApiItem = Omit<FeedbackItem, 'timestamp'> & { timestamp: string };

const serializeFeedback = (items: FeedbackItem[]): FeedbackApiItem[] =>
  items.map((item) => ({
    ...item,
    timestamp: item.timestamp.toISOString(),
  }));

export const onRequest: PagesFunction = async ({ env }) => {
  try {
    const db = env.ANALYTICS_DB as D1Database;
    let items: FeedbackApiItem[] = [];
    
    if (db) {
      try {
        const { results } = await db
          .prepare('SELECT payload FROM feedback_entries')
          .all<{ payload: string }>();
        items = (results?.map((row) => JSON.parse(row.payload)) ?? []) as FeedbackApiItem[];
      } catch (dbError) {
        console.error('[AI Debug] D1 query error:', dbError);
      }
    }

    const sourceItems = items.length > 0 ? items : serializeFeedback(mockFeedback);

    // Check if AI binding exists
    const aiAvailable = !!env.AI;
    const aiType = typeof env.AI;
    const aiKeys = env.AI ? Object.keys(env.AI) : [];
    
    let testResult: any = null;
    let testError: any = null;
    let rawResponse: string = '';
    
    if (env.AI) {
      try {
        // Make a simple test call to see what we get back
        const result = await (env.AI as AiBinding).run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { 
              role: 'system', 
              content: 'You are a JSON API. Respond with ONLY valid JSON. No markdown, no code blocks, no explanations.' 
            },
            { 
              role: 'user', 
              content: 'Return this JSON: {"test": "success", "message": "AI is working"}' 
            },
          ],
        });
        
        testResult = {
          success: true,
          resultType: typeof result,
          resultKeys: Object.keys(result),
          resultStructure: JSON.stringify(result).substring(0, 5000),
          hasResponse: !!(result as any).response,
          hasText: !!(result as any).text,
          hasResult: !!(result as any).result,
          hasOutput: !!(result as any).output,
          responseValue: (result as any).response ? String((result as any).response).substring(0, 500) : null,
          textValue: (result as any).text ? String((result as any).text).substring(0, 500) : null,
          resultValue: (result as any).result ? String((result as any).result).substring(0, 500) : null,
        };
        
        // Try to extract the actual text
        rawResponse = (result as any).response ?? 
                     (result as any).text ?? 
                     (result as any).result ?? 
                     (result as any).output ?? 
                     JSON.stringify(result);
        rawResponse = String(rawResponse);
        
      } catch (error) {
        testError = {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        };
      }
    }
    
    return new Response(
      JSON.stringify({
        aiAvailable,
        aiType,
        aiKeys,
        testResult,
        testError,
        rawResponse: rawResponse.substring(0, 5000),
        rawResponseLength: rawResponse.length,
        envKeys: Object.keys(env).filter((k) => k === 'AI' || k.toLowerCase().includes('ai')),
      }, null, 2),
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, null, 2),
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
        status: 500,
      }
    );
  }
};
