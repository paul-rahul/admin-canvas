import { useEffect, useMemo, useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { FeedbackItem } from '@/data/mockFeedback';

interface AIInsightsProps {
  feedback: FeedbackItem[];
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

export function AIInsights({ feedback }: AIInsightsProps) {
  const [serverInsights, setServerInsights] = useState<InsightPayload | null>(null);

  const criticalCount = feedback.filter(f => f.urgency === 'critical' && !f.resolved).length;
  const criticalPercent = feedback.length
    ? Math.round((criticalCount / feedback.length) * 1000) / 10
    : 0;
  const featureRequests = feedback.filter(f => f.issueType === 'feature').length;

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
        title: 'Critical Rate',
        content: `${criticalPercent}% of feedback items are marked critical.`,
        type: 'warning',
      },
    ],
    [criticalCount, criticalPercent, featureRequests]
  );

  const insights = useMemo(
    () => serverInsights?.insights ?? fallbackInsights,
    [serverInsights, fallbackInsights]
  );

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
    <div className="glass rounded-xl p-6 shadow-card opacity-0 animate-slide-up stagger-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg gradient-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">AI Insights</h3>
          <p className="text-xs text-muted-foreground">Powered by Workers AI</p>
        </div>
      </div>
      
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

    </div>
  );
}
