import { FeedbackItem, sourceConfig } from '@/data/mockFeedback';
import { cn } from '@/lib/utils';

interface SourceDistributionProps {
  feedback: FeedbackItem[];
}

export function SourceDistribution({ feedback }: SourceDistributionProps) {
  const sourceCounts = feedback.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = feedback.length;

  const sources = Object.entries(sourceCounts)
    .map(([key, value]) => ({
      source: key,
      count: value,
      percentage: Math.round((value / total) * 100),
      config: sourceConfig[key as keyof typeof sourceConfig],
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="glass rounded-xl p-6 shadow-card opacity-0 animate-slide-up stagger-4">
      <h3 className="text-lg font-semibold mb-4">Feedback Sources</h3>
      <div className="space-y-4">
        {sources.map((item) => (
          <div key={item.source} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground capitalize">{item.config.label}</span>
              <span className="font-medium">{item.count} ({item.percentage}%)</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", item.config.color)}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
