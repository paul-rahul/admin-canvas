import { useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FeedbackItem } from '@/data/mockFeedback';

type TimeRangeKey = '1d' | '7d' | '1m' | '3m' | '6m' | '1y';

const DAY_MS = 24 * 60 * 60 * 1000;

const timeRanges: Record<
  TimeRangeKey,
  { label: string; windowMs: number; bucketMs: number; formatString: string }
> = {
  '1d': { label: '1 day', windowMs: DAY_MS, bucketMs: 60 * 60 * 1000, formatString: 'ha' },
  '7d': { label: '7 days', windowMs: 7 * DAY_MS, bucketMs: DAY_MS, formatString: 'MMM d' },
  '1m': { label: '1 month', windowMs: 30 * DAY_MS, bucketMs: 7 * DAY_MS, formatString: 'MMM d' },
  '3m': { label: '3 months', windowMs: 90 * DAY_MS, bucketMs: 7 * DAY_MS, formatString: 'MMM d' },
  '6m': { label: '6 months', windowMs: 180 * DAY_MS, bucketMs: 14 * DAY_MS, formatString: 'MMM d' },
  '1y': { label: '1 year', windowMs: 365 * DAY_MS, bucketMs: 30 * DAY_MS, formatString: 'MMM d' },
};

const normalizeUrgency = (value?: string | null) => {
  const normalized = value?.toLowerCase();
  if (normalized === 'low') return 1;
  if (normalized === 'medium') return 2;
  if (normalized === 'high') return 3;
  if (normalized === 'critical') return 4;
  return null;
};

type TrendPoint = {
  label: string;
  count: number;
  avgUrgency: number | null;
};

interface IssueTrendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: FeedbackItem[];
  issueTypeId: string | null;
  issueTypeLabel: string | null;
}

export function IssueTrendModal({
  open,
  onOpenChange,
  entries,
  issueTypeId,
  issueTypeLabel,
}: IssueTrendModalProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('7d');

  const trendData = useMemo<TrendPoint[]>(() => {
    if (!issueTypeId) return [];
    const config = timeRanges[timeRange];
    const now = Date.now();
    const start = now - config.windowMs;
    const bucketCount = Math.max(1, Math.ceil(config.windowMs / config.bucketMs));

    const buckets = Array.from({ length: bucketCount }, (_, index) => ({
      start: start + index * config.bucketMs,
      count: 0,
      urgencySum: 0,
      urgencyCount: 0,
    }));

    entries.forEach((entry) => {
      if (entry.issueType !== issueTypeId) return;
      const timestamp = entry.timestamp?.getTime?.() ?? null;
      if (!timestamp || timestamp < start || timestamp > now) return;
      const bucketIndex = Math.min(
        buckets.length - 1,
        Math.max(0, Math.floor((timestamp - start) / config.bucketMs))
      );
      const bucket = buckets[bucketIndex];
      bucket.count += 1;
      const urgencyValue = normalizeUrgency(entry.urgency);
      if (urgencyValue !== null) {
        bucket.urgencySum += urgencyValue;
        bucket.urgencyCount += 1;
      }
    });

    return buckets.map((bucket) => ({
      label: format(new Date(bucket.start), config.formatString),
      count: bucket.count,
      avgUrgency: bucket.urgencyCount ? bucket.urgencySum / bucket.urgencyCount : null,
    }));
  }, [entries, issueTypeId, timeRange]);

  const hasData = trendData.some((point) => point.count > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
            <DialogTitle>Trend</DialogTitle>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRangeKey)}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(timeRanges).map(([key, range]) => (
                  <SelectItem key={key} value={key}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            {issueTypeLabel ? `${issueTypeLabel} · ` : ''}Ticket count and average urgency are shown over the selected time range.
          </p>
        </DialogHeader>

        <div className="h-72 w-full">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }}
                  width={32}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 4]}
                  tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 10%)',
                    border: '1px solid hsl(222, 47%, 16%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Avg Urgency') {
                      return [value.toFixed(2), 'Avg Urgency'];
                    }
                    return [value, 'Tickets'];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  name="Tickets"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgUrgency"
                  name="Avg Urgency"
                  stroke="hsl(199 89% 48%)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/70 text-sm text-muted-foreground">
              No data available for this time range.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
