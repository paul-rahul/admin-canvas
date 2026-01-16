import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { FeedbackItem } from '@/data/mockFeedback';

interface AIInsightsProps {
  feedback: FeedbackItem[];
}

export function AIInsights({ feedback }: AIInsightsProps) {
  const criticalCount = feedback.filter(f => f.urgency === 'critical' && !f.resolved).length;
  const negativeCount = feedback.filter(f => f.sentiment === 'negative').length;
  const bugCount = feedback.filter(f => f.category === 'bug').length;
  const featureRequests = feedback.filter(f => f.category === 'feature').length;

  const insights = [
    {
      icon: AlertTriangle,
      title: 'Critical Issues',
      content: `${criticalCount} unresolved critical tickets require immediate attention. API rate limiting and SSL issues are top priorities.`,
      type: 'warning' as const,
    },
    {
      icon: TrendingUp,
      title: 'Trending Topics',
      content: 'Performance issues (especially in APAC region) and documentation gaps are recurring themes this week.',
      type: 'info' as const,
    },
    {
      icon: Lightbulb,
      title: 'Feature Opportunities',
      content: `${featureRequests} feature requests identified. Top asks: improved cron scheduling, more AI models, and dark mode improvements.`,
      type: 'success' as const,
    },
  ];

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
              <insight.icon className={`h-4 w-4 ${iconStyles[insight.type]}`} />
              <h4 className="font-medium text-sm">{insight.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{insight.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-medium">{negativeCount} negative</span> and{' '}
          <span className="text-destructive font-medium">{bugCount} bug reports</span> analyzed from{' '}
          <span className="font-medium text-foreground">{feedback.length} total feedback items</span>
        </p>
      </div>
    </div>
  );
}
