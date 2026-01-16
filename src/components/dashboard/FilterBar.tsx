import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sourceConfig, urgencyConfig, Urgency, FeedbackSource } from '@/data/mockFeedback';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  activeSource: FeedbackSource | 'all';
  activeUrgency: Urgency | 'all';
  onSourceChange: (source: FeedbackSource | 'all') => void;
  onUrgencyChange: (urgency: Urgency | 'all') => void;
}

export function FilterBar({ activeSource, activeUrgency, onSourceChange, onUrgencyChange }: FilterBarProps) {
  const sources: (FeedbackSource | 'all')[] = ['all', 'support', 'discord', 'github', 'twitter', 'email', 'forum'];
  const urgencies: (Urgency | 'all')[] = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <div className="glass rounded-xl p-4 shadow-card opacity-0 animate-slide-up stagger-1">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">Source:</span>
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <Button
                key={source}
                variant="ghost"
                size="sm"
                onClick={() => onSourceChange(source)}
                className={cn(
                  "h-8 px-3 capitalize",
                  activeSource === source 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "hover:bg-muted"
                )}
              >
                {source === 'all' ? 'All' : sourceConfig[source].label}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-border hidden md:block" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">Urgency:</span>
          <div className="flex flex-wrap gap-2">
            {urgencies.map((urgency) => (
              <Badge
                key={urgency}
                variant="outline"
                onClick={() => onUrgencyChange(urgency)}
                className={cn(
                  "cursor-pointer capitalize hover:opacity-80 transition-opacity",
                  activeUrgency === urgency
                    ? urgency === 'all'
                      ? "bg-primary text-primary-foreground border-primary"
                      : cn(urgencyConfig[urgency].bgColor, urgencyConfig[urgency].color, "border-transparent")
                    : "border-border"
                )}
              >
                {urgency}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
