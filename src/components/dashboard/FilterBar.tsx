import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sourceConfig, FeedbackSource } from '@/data/mockFeedback';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  activeSource: FeedbackSource | 'all';
  activeTime: '24h' | '7d' | '30d' | 'all';
  onSourceChange: (source: FeedbackSource | 'all') => void;
  onTimeChange: (time: '24h' | '7d' | '30d' | 'all') => void;
}

export function FilterBar({ activeSource, activeTime, onSourceChange, onTimeChange }: FilterBarProps) {
  const sources: (FeedbackSource | 'all')[] = ['all', 'support', 'discord', 'github', 'twitter', 'email', 'forum'];
  const times: ('24h' | '7d' | '30d' | 'all')[] = ['24h', '7d', '30d', 'all'];
  const timeLabels: Record<typeof times[number], string> = {
    '24h': 'Last 24h',
    '7d': 'Last 7d',
    '30d': 'Last 30d',
    all: 'All',
  };

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
          <span className="text-sm text-muted-foreground font-medium">Time:</span>
          <div className="flex flex-wrap gap-2">
            {times.map((time) => (
              <Badge
                key={time}
                variant="outline"
                onClick={() => onTimeChange(time)}
                className={cn(
                  "cursor-pointer hover:opacity-80 transition-opacity",
                  activeTime === time
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border"
                )}
              >
                {timeLabels[time]}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
