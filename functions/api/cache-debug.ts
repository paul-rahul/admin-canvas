// Debug endpoint for cache inspection
type PagesFunction = (args: { env: any; request: Request }) => Promise<Response>;

type KVNamespace = {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ keys: Array<{ name: string; expiration?: number }> }>;
};

export const onRequest: PagesFunction = async ({ env, request }) => {
  const kv = env.INSIGHTS_CACHE as KVNamespace | undefined;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'status';

  if (!kv) {
    return new Response(
      JSON.stringify({
        error: 'KV namespace not available',
        kvAvailable: false,
        message: 'INSIGHTS_CACHE binding not configured',
      }),
      {
        headers: { 'content-type': 'application/json' },
        status: 500,
      }
    );
  }

  try {
    switch (action) {
      case 'status': {
        // Check if KV is accessible
        // Note: KV requires minimum TTL of 60 seconds
        const testKey = 'test-connection';
        try {
          await kv.put(testKey, 'test', { expirationTtl: 60 });
          await kv.delete(testKey);
        } catch (error) {
          return new Response(
            JSON.stringify({
              kvAvailable: true,
              kvAccessible: false,
              error: error instanceof Error ? error.message : String(error),
            }),
            {
              headers: { 'content-type': 'application/json' },
              status: 500,
            }
          );
        }

        // List keys
        let keys: Array<{ name: string; expiration?: number }> = [];
        try {
          const listResult = await kv.list({ limit: 100 });
          keys = listResult.keys || [];
        } catch (error) {
          console.warn('[Cache Debug] Failed to list keys:', error);
        }

        return new Response(
          JSON.stringify({
            kvAvailable: true,
            kvAccessible: true,
            keyCount: keys.length,
            keys: keys.map((k) => ({
              name: k.name,
              expiresAt: k.expiration ? new Date(k.expiration * 1000).toISOString() : null,
            })),
          }),
          {
            headers: { 'content-type': 'application/json' },
          }
        );
      }

      case 'get': {
        const key = url.searchParams.get('key') || 'ai-insights:latest';
        const cached = await kv.get(key, { type: 'json' });
        
        if (!cached) {
          return new Response(
            JSON.stringify({
              key,
              found: false,
              message: 'Key not found in cache',
            }),
            {
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        const cachedData = cached as any;
        const now = Date.now();
        const cacheAge = cachedData.cachedAt ? now - cachedData.cachedAt : null;
        const isExpired = cacheAge && cacheAge > 5 * 60 * 1000; // 5 minutes

        return new Response(
          JSON.stringify({
            key,
            found: true,
            data: cachedData,
            metadata: {
              cachedAt: cachedData.cachedAt ? new Date(cachedData.cachedAt).toISOString() : null,
              cacheAgeSeconds: cacheAge ? Math.round(cacheAge / 1000) : null,
              isExpired,
              source: cachedData.source || 'unknown',
            },
          }),
          {
            headers: { 'content-type': 'application/json' },
          }
        );
      }

      case 'delete': {
        const key = url.searchParams.get('key') || 'ai-insights:latest';
        await kv.delete(key);
        return new Response(
          JSON.stringify({
            success: true,
            key,
            message: 'Cache key deleted',
          }),
          {
            headers: { 'content-type': 'application/json' },
          }
        );
      }

      case 'clear': {
        // List and delete all keys
        const listResult = await kv.list({ limit: 100 });
        const keys = listResult.keys || [];
        const deleted: string[] = [];
        
        for (const key of keys) {
          try {
            await kv.delete(key.name);
            deleted.push(key.name);
          } catch (error) {
            console.error(`[Cache Debug] Failed to delete ${key.name}:`, error);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            deletedCount: deleted.length,
            deletedKeys: deleted,
          }),
          {
            headers: { 'content-type': 'application/json' },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({
            error: 'Invalid action',
            availableActions: ['status', 'get', 'delete', 'clear'],
          }),
          {
            headers: { 'content-type': 'application/json' },
            status: 400,
          }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Cache debug error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { 'content-type': 'application/json' },
        status: 500,
      }
    );
  }
};
