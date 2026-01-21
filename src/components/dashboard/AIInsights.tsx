import { memo, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, Info, Loader2 } from 'lucide-react';
import { FeedbackItem } from '@/data/mockFeedback';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AIInsightsProps {
  feedback: FeedbackItem[];
  compact?: boolean;
  onViewCriticalTickets?: () => void;
}

type Insight = {
  title: string;
  content: string;
  type: 'warning' | 'info' | 'success' | 'primary';
};

type InsightPayload = {
  insights: Insight[];
  summary?: string;
  source?: 'ai' | 'fallback';
  aiAvailable?: boolean;
  aiError?: string;
  cached?: boolean;
  cacheAgeSeconds?: number;
};

function AIInsightsComponent({ feedback, compact = false, onViewCriticalTickets }: AIInsightsProps) {
  const [serverInsights, setServerInsights] = useState<InsightPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isLoadingRef = useRef(false);
  const hasMountedRef = useRef(false);
  
  console.log('[AI Insights] Component rendered, hasMountedRef:', hasMountedRef.current);

  const { criticalCount, featureRequests } = useMemo(() => {
    let critical = 0;
    let features = 0;
    feedback.forEach((item) => {
      if (item.urgency === 'critical' && !item.resolved) {
        critical += 1;
      }
      if (item.issueType === 'feature') {
        features += 1;
      }
    });
    return { criticalCount: critical, featureRequests: features };
  }, [feedback]);

  const fallbackInsights = useMemo<Insight[]>(
    () => [
      {
        title: 'Critical Issues',
        content: `${criticalCount} unresolved critical tickets require immediate attention.`,
        type: 'warning',
      },
      {
        title: 'Trending Topics',
        content: 'Performance issues and documentation gaps are recurring themes this week.',
        type: 'info',
      },
      {
        title: 'Feature Opportunities',
        content: `${featureRequests} feature requests identified. Focus on cron scheduling and dashboard UX.`,
        type: 'success',
      },
      {
        title: 'Feedback Volume',
        content: `${feedback.length} total feedback entries analyzed. Review patterns to identify improvement areas.`,
        type: 'info',
      },
    ],
    [criticalCount, featureRequests, feedback.length]
  );

  const insights = useMemo(() => {
    // Prioritize server insights if available, but don't fall back to local fallback if we're waiting for AI
    const list = serverInsights?.insights && serverInsights.insights.length > 0 
      ? serverInsights.insights 
      : (isLoading ? [] : fallbackInsights);
    
    // Show all insights, don't filter out Critical Issues
    // Ensure we have exactly 4 insights (pad with defaults if needed)
    if (list.length < 4) {
      const padded = [...list];
      while (padded.length < 4) {
        padded.push({
          title: 'Additional Insight',
          content: 'Analyzing feedback patterns and trends.',
          type: 'info' as const,
        });
      }
      return padded.slice(0, 4);
    }
    return list.slice(0, 4);
  }, [serverInsights, fallbackInsights, isLoading]);

  const typeStyles = {
    warning: 'border-l-warning bg-warning/5',
    info: 'border-l-info bg-info/5',
    success: 'border-l-success bg-success/5',
    primary: 'border-l-primary bg-primary/5',
  };

  const iconStyles = {
    warning: 'text-warning',
    info: 'text-info',
    success: 'text-success',
    primary: 'text-primary',
  };

  const loadInsights = useCallback(async (retryAttempt = 0, forceGenerate = false) => {
    console.log(`[AI Insights] loadInsights called - retryAttempt: ${retryAttempt}, forceGenerate: ${forceGenerate}, isLoadingRef.current: ${isLoadingRef.current}`);
    
    // Only prevent duplicate calls on initial attempt (retryAttempt === 0)
    // Allow retries even if loading
    if (isLoadingRef.current && retryAttempt === 0 && !forceGenerate) {
      console.log('[AI Insights] Already loading (non-forced), skipping duplicate call');
      return;
    }
    
    // If forceGenerate is true, always proceed even if loading
    if (forceGenerate) {
      console.log('[AI Insights] Force generate requested, proceeding despite loading state');
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      // Add timestamp to prevent browser caching, but allow server-side cache check
      // If forceGenerate is true, add a parameter to force regeneration
      const url = forceGenerate 
        ? `/api/insights?t=${Date.now()}&force=true`
        : `/api/insights?t=${Date.now()}`;
      console.log(`[AI Insights] Fetching from: ${url}`);
      const response = await fetch(url, {
        cache: 'no-store', // Prevent browser caching
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      console.log(`[AI Insights] Response status: ${response.status}, ok: ${response.ok}`);
      if (!response.ok) {
        throw new Error(`Failed to load AI insights: ${response.status}`);
      }
      const payload = (await response.json()) as InsightPayload;
      console.log('[AI Insights] Received payload:', { 
        source: payload?.source, 
        aiAvailable: payload?.aiAvailable,
        insightsCount: payload?.insights?.length,
        cached: payload?.cached,
        aiError: payload?.aiError,
        fullPayload: payload
      });
      
      // Always update state with the received payload
      // The API is working correctly and returning AI insights, so we should trust it
      setServerInsights((prev) => {
        console.log('[AI Insights] setServerInsights called - prev:', prev?.source, 'new:', payload?.source);
        
        // If we already have AI-generated content, NEVER replace it with fallback
        if (prev?.source === 'ai' && payload?.source === 'fallback') {
          console.log('[AI Insights] Keeping existing AI-generated content, ignoring fallback');
          return prev;
        }
        // If we have fallback and new payload is AI, always update to AI
        if (prev?.source === 'fallback' && payload?.source === 'ai') {
          console.log('[AI Insights] Updating from fallback to AI-generated content');
          return payload;
        }
        // If both are fallback, update if new one has insights
        if (prev?.source === 'fallback' && payload?.source === 'fallback') {
          if (!prev?.insights?.length && payload?.insights?.length) {
            console.log('[AI Insights] Updating fallback with new insights');
            return payload; // Update if we got insights
          }
          console.log('[AI Insights] Keeping existing fallback');
          return prev; // Keep existing fallback
        }
        // Otherwise, always update (null -> anything, or AI -> AI, or null -> AI)
        console.log('[AI Insights] Updating state with new payload');
        return payload;
      });
      
      if (payload?.insights?.length) {
        setRetryCount(0); // Reset retry count on success
      } else if (payload) {
        // If we got a response but no insights, still update status (but don't overwrite AI)
        // Only update if we don't have AI content already
        setServerInsights((prev) => {
          if (prev?.source === 'ai') {
            return prev; // Keep AI content
          }
          return payload; // Update with new status
        });
      } else {
        throw new Error('Invalid insights payload');
      }
    } catch (error) {
      console.error('[AI Insights] Failed to load insights:', error);
      // Retry up to 2 times with exponential backoff
      // Preserve forceGenerate flag on retry
      if (retryAttempt < 2) {
        const delay = Math.pow(2, retryAttempt) * 1000; // 1s, 2s
        console.log(`[AI Insights] Retrying in ${delay}ms (attempt ${retryAttempt + 1}/2)`);
        setTimeout(() => {
          loadInsights(retryAttempt + 1, forceGenerate);
        }, delay);
      } else {
        // Only set to null if we don't have AI content already
        setServerInsights((prev) => {
          if (prev?.source === 'ai') {
            console.log('[AI Insights] Keeping existing AI-generated content despite error');
            return prev; // Keep AI content even on error
          }
          return null; // Only clear if we don't have AI content
        });
        setRetryCount(retryAttempt);
      }
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      console.log('[AI Insights] loadInsights completed, isLoadingRef set to false');
    }
  }, []);

  useEffect(() => {
    // On initial mount, ALWAYS load insights
    // The API will check cache first, and if empty/expired/fallback, it will generate new insights
    if (hasMountedRef.current) {
      console.log('[AI Insights] Component already mounted, skipping initial load');
      return;
    }
    
    hasMountedRef.current = true;
    console.log('[AI Insights] Component mounted for first time');
    console.log('[AI Insights] Starting initial load with forceGenerate=true');
    
    // ALWAYS call API on mount - force generation to ensure we get insights
    // Don't check isLoadingRef - we need to ensure the API is called
    setTimeout(() => {
      void loadInsights(0, true);
    }, 100); // Small delay to ensure component is fully mounted
  }, [loadInsights]); // Include loadInsights in deps to ensure it's available

  // Refetch when overlay opens (listen to custom event from Header)
  useEffect(() => {
    const handleOverlayOpened = () => {
      console.log('[AI Insights] Overlay opened event received');
      console.log('[AI Insights] Current serverInsights state:', { 
        source: serverInsights?.source, 
        cached: serverInsights?.cached,
        hasInsights: !!serverInsights?.insights?.length 
      });
      
      // Only skip if we have FRESH cached AI insights (cached and less than 5 min old)
      // If cache is empty or expired, we need to call the API
      if (serverInsights?.source === 'ai' && serverInsights?.cached && serverInsights?.cacheAgeSeconds !== undefined) {
        const cacheAge = serverInsights.cacheAgeSeconds;
        if (cacheAge < 300) { // Less than 5 minutes (300 seconds)
          console.log(`[AI Insights] Using cached AI insights (age: ${cacheAge}s), skipping API call`);
          return;
        } else {
          console.log(`[AI Insights] Cache expired (age: ${cacheAge}s), calling API to refresh`);
        }
      }
      
      // Always call API if:
      // - No insights yet
      // - Insights are fallback
      // - Cache is expired
      // - Cache status unknown
      console.log('[AI Insights] Calling API to fetch/refresh insights');
      void loadInsights(0, false); // Let API check cache first, but ensure it's called
    };
    window.addEventListener('insights-overlay-opened', handleOverlayOpened);
    return () => {
      window.removeEventListener('insights-overlay-opened', handleOverlayOpened);
    };
  }, [loadInsights, serverInsights]);

  return (
    <div className="glass rounded-xl p-4 shadow-card self-start">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg gradient-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <h3 className="text-base font-semibold">AI Insights</h3>
          {serverInsights?.source === 'ai' ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success border border-success/30 font-medium">
              AI Generated
            </span>
          ) : serverInsights?.source === 'fallback' && serverInsights?.aiAvailable !== false ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/30 font-medium">
              Fallback Mode
            </span>
          ) : serverInsights?.aiAvailable === false ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
              AI Not Available
            </span>
          ) : null}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="AI Insights information"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs whitespace-normal">
                <div className="space-y-2">
                  <p className="font-semibold">How AI Insights are Generated</p>
                  {serverInsights?.source === 'ai' ? (
                    <p className="text-success">✓ Using Cloudflare Workers AI</p>
                  ) : serverInsights?.aiAvailable ? (
                    <div>
                      <p className="text-warning">⚠ Using fallback insights</p>
                      {serverInsights?.aiError && (
                        <p className="text-xs text-muted-foreground mt-1">Error: {serverInsights.aiError}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">AI binding not configured. Using default insights.</p>
                  )}
                  <p>Insights analyze your feedback data including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Ticket volumes and trends</li>
                    <li>Sentiment and urgency distributions</li>
                    <li>Issue types and sources</li>
                    <li>Customer segments and resolution status</li>
                    <li>Critical issues and recent negative feedback</li>
                  </ul>
                  {serverInsights?.source === 'ai' && (
                    <p className="text-muted-foreground">The AI generates actionable insights to help prioritize work and understand product health.</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isLoading && !serverInsights?.cached && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Generating insights...</span>
            </div>
          )}
        </div>
      </div>

      {compact ? (
        <div className="grid grid-cols-2 gap-3">
          {insights.map((insight, index) => {
            // Assign different colors to each card position
            const colorTypes: Array<'warning' | 'info' | 'success' | 'primary'> = ['warning', 'info', 'success', 'primary'];
            const cardType = colorTypes[index % 4];
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${typeStyles[cardType]} relative`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {cardType === 'warning' && (
                    <AlertTriangle className={`h-4 w-4 ${iconStyles[cardType]}`} />
                  )}
                  {cardType === 'info' && (
                    <TrendingUp className={`h-4 w-4 ${iconStyles[cardType]}`} />
                  )}
                  {cardType === 'success' && (
                    <Lightbulb className={`h-4 w-4 ${iconStyles[cardType]}`} />
                  )}
                  {cardType === 'primary' && (
                    <Sparkles className={`h-4 w-4 ${iconStyles[cardType]}`} />
                  )}
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{insight.content}</p>
                {/* Always show View Tickets button on first card (Critical Issues) */}
                {index === 0 && onViewCriticalTickets && (
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onViewCriticalTickets}
                      className="h-7 text-xs gap-1"
                    >
                      View Tickets
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => {
            // Assign different colors to each card position
            const colorTypes: Array<'warning' | 'info' | 'success' | 'primary'> = ['warning', 'info', 'success', 'primary'];
            const cardType = colorTypes[index % 4];
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${typeStyles[cardType]} relative`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {cardType === 'warning' && (
                    <AlertTriangle className={`h-4 w-4 ${iconStyles[cardType]}`} />
                  )}
                  {cardType === 'info' && (
                    <TrendingUp className={`h-4 w-4 ${iconStyles[cardType]}`} />
                  )}
                  {cardType === 'success' && (
                    <Lightbulb className={`h-4 w-4 ${iconStyles[cardType]}`} />
                  )}
                  {cardType === 'primary' && (
                    <Sparkles className={`h-4 w-4 ${iconStyles[cardType]}`} />
                  )}
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{insight.content}</p>
                {/* Always show View Tickets button on first card (Critical Issues) */}
                {index === 0 && onViewCriticalTickets && (
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onViewCriticalTickets}
                      className="h-7 text-xs gap-1"
                    >
                      View Tickets
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export const AIInsights = memo(AIInsightsComponent);

AIInsights.displayName = 'AIInsights';
