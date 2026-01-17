import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button as UiButton } from '@/components/ui/button';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { sourceConfig, FeedbackSource } from '@/data/mockFeedback';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type TimeFilter = '24h' | '7d' | '30d' | 'all' | 'custom';

interface FilterBarProps {
  activeSource: FeedbackSource | 'all';
  activeTime: TimeFilter;
  onSourceChange: (source: FeedbackSource | 'all') => void;
  onTimeChange: (time: TimeFilter) => void;
  customRange: { from: Date | null; to: Date | null };
  onCustomRangeChange: (range: { from: Date | null; to: Date | null }) => void;
  isFiltering?: boolean;
}

const formatTime = (value: Date | null) => {
  if (!value) return '';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
};

const applyTimeToDate = (date: Date | null, timeValue: string) => {
  if (!date) return null;
  if (!timeValue) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  const [hour, minute] = timeValue.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return date;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
};

export function FilterBar({
  activeSource,
  activeTime,
  onSourceChange,
  onTimeChange,
  customRange,
  onCustomRangeChange,
  isFiltering = false,
}: FilterBarProps) {
  const sources: (FeedbackSource | 'all')[] = ['all', 'support', 'discord', 'github', 'twitter', 'email', 'forum'];
  const times: TimeFilter[] = ['24h', '7d', '30d', 'all', 'custom'];
  const timeLabels: Record<TimeFilter, string> = {
    '24h': 'Last 24h',
    '7d': 'Last 7d',
    '30d': 'Last 30d',
    all: 'All',
    custom: 'Custom',
  };

  return (
    <div className="glass rounded-xl p-4 shadow-card opacity-0 animate-slide-up stagger-1">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-medium">Source:</span>
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            {sources.map((source) => (
              <Button
                key={source}
                variant="outline"
                size="sm"
                onClick={() => onSourceChange(source)}
                className={cn(
                  "h-7 px-2 capitalize shrink-0 rounded-full text-[11px]",
                  activeSource === source
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-muted/30 hover:bg-muted"
                )}
              >
                {source === 'all' ? 'All' : sourceConfig[source].label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-nowrap">
          <span className="text-[11px] text-muted-foreground font-medium">Time:</span>
          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-x-auto min-w-0">
            {times.map((time) => (
              <Badge
                key={time}
                variant="outline"
                onClick={() => onTimeChange(time)}
                className={cn(
                  "cursor-pointer hover:opacity-80 transition-opacity shrink-0 text-[11px] px-2 py-1 h-7",
                  activeTime === time
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border"
                )}
              >
                {timeLabels[time]}
              </Badge>
            ))}
            {activeTime === 'custom' && (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 shadow-sm">
                  <Popover>
                    <PopoverTrigger asChild>
                      <UiButton
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-6 w-[110px] justify-start gap-1.5 border-border/60 bg-transparent px-2 text-[11px]",
                          !customRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {customRange.from ? format(customRange.from, 'MMM d, yyyy') : 'From'}
                      </UiButton>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-2">
                      <Calendar
                        mode="single"
                        selected={customRange.from ?? undefined}
                        onSelect={(date) => {
                          const nextDate = date
                            ? applyTimeToDate(date, formatTime(customRange.from))
                            : null;
                          onCustomRangeChange({ from: nextDate, to: customRange.to });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={formatTime(customRange.from)}
                    onChange={(event) => {
                      const baseDate = customRange.from ?? new Date();
                      const next = applyTimeToDate(baseDate, event.target.value);
                      onCustomRangeChange({ from: next, to: customRange.to });
                    }}
                    className="h-6 w-[52px] border-0 bg-transparent px-1 text-[11px] focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">to</span>
                <div className="flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 shadow-sm">
                  <Popover>
                    <PopoverTrigger asChild>
                      <UiButton
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-6 w-[110px] justify-start gap-1.5 border-border/60 bg-transparent px-2 text-[11px]",
                          !customRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {customRange.to ? format(customRange.to, 'MMM d, yyyy') : 'To'}
                      </UiButton>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-2">
                      <Calendar
                        mode="single"
                        selected={customRange.to ?? undefined}
                        onSelect={(date) => {
                          const nextDate = date
                            ? applyTimeToDate(date, formatTime(customRange.to))
                            : null;
                          onCustomRangeChange({ from: customRange.from, to: nextDate });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={formatTime(customRange.to)}
                    onChange={(event) => {
                      const baseDate = customRange.to ?? new Date();
                      const next = applyTimeToDate(baseDate, event.target.value);
                      onCustomRangeChange({ from: customRange.from, to: next });
                    }}
                    className="h-6 w-[52px] border-0 bg-transparent px-1 text-[11px] focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            )}
          </div>
          {isFiltering && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <Loader2 className="h-3 w-3 animate-spin" />
              Applying
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
