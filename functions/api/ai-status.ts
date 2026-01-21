// Debug endpoint for AI binding status
type PagesFunction = (args: { env: any; request: Request }) => Promise<Response>;

type AiBinding = {
  run: (
    model: string,
    options: {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    }
  ) => Promise<any>;
};

export const onRequest: PagesFunction = async ({ env }) => {
  const ai = env.AI as AiBinding | undefined;
  const aiAvailable = !!ai;
  const aiType = typeof ai;
  
  let aiMethods: string[] = [];
  let hasRunMethod = false;
  let testResult: any = null;
  let testError: string | null = null;

  if (ai) {
    aiMethods = Object.keys(ai);
    hasRunMethod = typeof (ai as any).run === 'function';
    
    // Try a simple test call
    if (hasRunMethod) {
      try {
        testResult = await ai.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: 'You are a test API. Respond with only: OK' },
            { role: 'user', content: 'Test' },
          ],
        });
      } catch (error) {
        testError = error instanceof Error ? error.message : String(error);
      }
    }
  }

  return new Response(
    JSON.stringify({
      aiAvailable,
      aiType,
      aiMethods,
      hasRunMethod,
      testResult: testResult ? {
        keys: Object.keys(testResult),
        response: testResult.response || testResult.text || testResult.result || 'No response property found',
        fullResult: JSON.stringify(testResult).substring(0, 500),
      } : null,
      testError,
      envKeys: Object.keys(env).filter(key => key !== 'AI' && key !== 'ANALYTICS_DB' && key !== 'INSIGHTS_CACHE'),
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
};
