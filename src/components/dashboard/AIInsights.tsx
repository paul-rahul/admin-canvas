import { memo, useEffect, useMemo, useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, Info } from 'lucide-react';
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
};

function AIInsightsComponent({ feedback, compact = false, onViewCriticalTickets }: AIInsightsProps) {
  const [serverInsights, setServerInsights] = useState<InsightPayload | null>(null);

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
    const list = serverInsights?.insights ?? fallbackInsights;
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
  }, [serverInsights, fallbackInsights]);

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

  useEffect(() => {
    let isMounted = true;

    const loadInsights = async () => {
      try {
        const response = await fetch('/api/insights');
        if (!response.ok) {
          throw new Error('Failed to load AI insights');
        }
        const payload = (await response.json()) as InsightPayload;
        if (isMounted && payload?.insights?.length) {
          setServerInsights(payload);
        }
      } catch (error) {
        if (isMounted) {
          setServerInsights(null);
        }
      }
    };

    void loadInsights();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="glass rounded-xl p-4 shadow-card self-start">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg gradient-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">AI Insights</h3>
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
                  <p>Insights are powered by Cloudflare Workers AI, analyzing feedback data including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Ticket volumes and trends</li>
                    <li>Sentiment and urgency distributions</li>
                    <li>Issue types and sources</li>
                    <li>Customer segments and resolution status</li>
                    <li>Critical issues and recent negative feedback</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {compact ? (
        <div className="grid grid-cols-2 gap-3">
          {insights.map((insight, index) => {
            // Assign different colors to each card position
            const colorTypes: Array<'warning' | 'info' | 'success' | 'primary'> = ['warning', 'info', 'success', 'primary'];
            const cardType = colorTypes[index % 4];
            const isCriticalIssues = insight.title.toLowerCase().includes('critical');
            
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
                {isCriticalIssues && onViewCriticalTickets && (
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
            const isCriticalIssues = insight.title.toLowerCase().includes('critical');
            
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
                {isCriticalIssues && onViewCriticalTickets && (
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
