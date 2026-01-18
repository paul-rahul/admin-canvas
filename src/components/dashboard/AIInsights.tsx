import { memo, useEffect, useMemo, useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { FeedbackItem } from '@/data/mockFeedback';

interface AIInsightsProps {
  feedback: FeedbackItem[];
  compact?: boolean;
}

type Insight = {
  title: string;
  content: string;
  type: 'warning' | 'info' | 'success';
};

type InsightPayload = {
  insights: Insight[];
  summary?: string;
};

function AIInsightsComponent({ feedback, compact = false }: AIInsightsProps) {
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
    ],
    [criticalCount, featureRequests]
  );

  const insights = useMemo(() => {
    const list = serverInsights?.insights ?? fallbackInsights;
    return list.filter((insight) => insight.title !== 'Critical Issues');
  }, [serverInsights, fallbackInsights]);

  const [trendingInsight, featureInsight] = insights;

  const typeStyles = {
    warning: 'border-l-warning bg-warning/5',
    info: 'border-l-info bg-info/5',
    success: 'border-l-success bg-success/5',
  };

  const iconStyles = {
    warning: 'text-warning',
    info: 'text-info',
    success: 'text-success',
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
    <div className="glass rounded-xl p-6 shadow-card h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg gradient-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-base font-semibold">AI Insights</h3>
        </div>
      </div>

      {compact ? (
        <div className="grid gap-3 md:grid-cols-2">
          {trendingInsight && (
            <div className={`p-4 rounded-lg border-l-4 ${typeStyles[trendingInsight.type]}`}>
              <div className="flex items-center gap-2 mb-2">
                {trendingInsight.type === 'warning' && (
                  <AlertTriangle className={`h-4 w-4 ${iconStyles[trendingInsight.type]}`} />
                )}
                {trendingInsight.type === 'info' && (
                  <TrendingUp className={`h-4 w-4 ${iconStyles[trendingInsight.type]}`} />
                )}
                {trendingInsight.type === 'success' && (
                  <Lightbulb className={`h-4 w-4 ${iconStyles[trendingInsight.type]}`} />
                )}
                <h4 className="font-medium text-sm">{trendingInsight.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{trendingInsight.content}</p>
            </div>
          )}
          {featureInsight && (
            <div className={`p-4 rounded-lg border-l-4 ${typeStyles[featureInsight.type]}`}>
              <div className="flex items-center gap-2 mb-2">
                {featureInsight.type === 'warning' && (
                  <AlertTriangle className={`h-4 w-4 ${iconStyles[featureInsight.type]}`} />
                )}
                {featureInsight.type === 'info' && (
                  <TrendingUp className={`h-4 w-4 ${iconStyles[featureInsight.type]}`} />
                )}
                {featureInsight.type === 'success' && (
                  <Lightbulb className={`h-4 w-4 ${iconStyles[featureInsight.type]}`} />
                )}
                <h4 className="font-medium text-sm">{featureInsight.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{featureInsight.content}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${typeStyles[insight.type]}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {insight.type === 'warning' && (
                  <AlertTriangle className={`h-4 w-4 ${iconStyles[insight.type]}`} />
                )}
                {insight.type === 'info' && (
                  <TrendingUp className={`h-4 w-4 ${iconStyles[insight.type]}`} />
                )}
                {insight.type === 'success' && (
                  <Lightbulb className={`h-4 w-4 ${iconStyles[insight.type]}`} />
                )}
                <h4 className="font-medium text-sm">{insight.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{insight.content}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export const AIInsights = memo(AIInsightsComponent);

AIInsights.displayName = 'AIInsights';
