import { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, ReferenceArea } from 'recharts';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { issueTypeConfig, sourceConfig, type FeedbackItem } from '@/data/mockFeedback';

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
  startMs: number;
  endMs: number;
};

interface IssueTrendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: FeedbackItem[];
  summaryEntries: FeedbackItem[];
  issueTypeId: string | null;
  issueTypeLabel: string | null;
  onTimeRangeSelect?: (range: { from: Date; to: Date }) => void;
}

export function IssueTrendModal({
  open,
  onOpenChange,
  entries,
  summaryEntries,
  issueTypeId,
  issueTypeLabel,
  onTimeRangeSelect,
}: IssueTrendModalProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('7d');
  const [selectedRange, setSelectedRange] = useState<{ startIndex: number; endIndex: number } | null>(
    null
  );
  const [dragRange, setDragRange] = useState<{ startIndex: number; endIndex: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

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
      startMs: bucket.start,
      endMs: bucket.start + config.bucketMs,
    }));
  }, [entries, issueTypeId, timeRange]);

  const hasData = trendData.some((point) => point.count > 0);
  const selectedRangeData = useMemo(() => {
    if (!selectedRange || !trendData.length) return null;
    const start = trendData[selectedRange.startIndex];
    const end = trendData[selectedRange.endIndex];
    if (!start || !end) return null;
    return { startMs: start.startMs, endMs: end.endMs };
  }, [selectedRange, trendData]);

  const summary = useMemo(() => {
    if (!selectedRangeData) return null;
    const { startMs, endMs } = selectedRangeData;
    const entriesInRange = summaryEntries.filter((entry) => {
      const timestamp = entry.timestamp?.getTime?.() ?? null;
      if (!timestamp) return false;
      return timestamp >= startMs && timestamp <= endMs;
    });

    const total = entriesInRange.length;
    const bucketCount =
      selectedRange && selectedRange.endIndex >= selectedRange.startIndex
        ? selectedRange.endIndex - selectedRange.startIndex + 1
        : 0;
    const avgPerBucket = bucketCount ? total / bucketCount : 0;

    const sourceCounts: Record<string, number> = {};
    const issueTypeCounts: Record<string, number> = {};
    entriesInRange.forEach((entry) => {
      if (entry.source) {
        sourceCounts[entry.source] = (sourceCounts[entry.source] ?? 0) + 1;
      }
      if (entry.issueType) {
        issueTypeCounts[entry.issueType] = (issueTypeCounts[entry.issueType] ?? 0) + 1;
      }
    });

    const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0] ?? null;
    const topIssueType = Object.entries(issueTypeCounts).sort((a, b) => b[1] - a[1])[0] ?? null;

    return {
      total,
      avgPerBucket,
      topSource,
      topIssueType,
    };
  }, [selectedRange, selectedRangeData, summaryEntries]);

  useEffect(() => {
    setSelectedRange(null);
    setDragRange(null);
    setIsSelecting(false);
  }, [issueTypeId, timeRange]);

  useEffect(() => {
    if (!chartRef.current) return;
    setChartWidth(chartRef.current.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setChartWidth(entry.contentRect.width);
      }
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

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

        <div className="relative h-72 w-full" ref={chartRef}>
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
                {(dragRange || selectedRange) && (() => {
                  const range = dragRange ?? selectedRange;
                  if (!range) return null;
                  const startIndex = Math.min(range.startIndex, range.endIndex);
                  const endIndex = Math.max(range.startIndex, range.endIndex);
                  const startLabel = trendData[startIndex]?.label;
                  const endLabel = trendData[endIndex]?.label;
                  if (!startLabel || !endLabel) return null;
                  return (
                    <ReferenceArea
                      x1={startLabel}
                      x2={endLabel}
                      stroke="hsl(var(--primary))"
                      strokeOpacity={0.35}
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  );
                })()}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/70 text-sm text-muted-foreground">
              No data available for this time range.
            </div>
          )}
          {hasData && chartWidth > 0 && (dragRange || selectedRange) && (() => {
            const range = dragRange ?? selectedRange;
            if (!range || trendData.length === 0) return null;
            const startIndex = Math.min(range.startIndex, range.endIndex);
            const endIndex = Math.max(range.startIndex, range.endIndex);
            const bucketWidth = chartWidth / trendData.length;
            const left = startIndex * bucketWidth;
            const width = (endIndex - startIndex + 1) * bucketWidth;
            return (
              <div
                className="absolute inset-y-0 z-20 rounded-md border border-primary/50 bg-primary/15 pointer-events-none"
                style={{ left, width }}
              />
            );
          })()}
          {hasData && (
            <div
              className="absolute inset-0 z-30 cursor-crosshair"
              role="presentation"
              onMouseDown={(event) => {
                if (!chartRef.current || trendData.length === 0) return;
                const rect = chartRef.current.getBoundingClientRect();
                setChartWidth(rect.width);
                const x = event.clientX - rect.left;
                const ratio = Math.min(1, Math.max(0, x / rect.width));
                const index = Math.round(ratio * (trendData.length - 1));
                setIsSelecting(true);
                setDragRange({ startIndex: index, endIndex: index });
              }}
              onMouseMove={(event) => {
                if (!isSelecting || !chartRef.current || trendData.length === 0) return;
                const rect = chartRef.current.getBoundingClientRect();
                setChartWidth(rect.width);
                const x = event.clientX - rect.left;
                const ratio = Math.min(1, Math.max(0, x / rect.width));
                const index = Math.round(ratio * (trendData.length - 1));
                setDragRange((prev) => (prev ? { startIndex: prev.startIndex, endIndex: index } : null));
              }}
              onMouseUp={() => {
                if (!dragRange || trendData.length === 0) {
                  setIsSelecting(false);
                  return;
                }
                const startIndex = Math.min(dragRange.startIndex, dragRange.endIndex);
                const endIndex = Math.max(dragRange.startIndex, dragRange.endIndex);
                setSelectedRange({ startIndex, endIndex });
                setDragRange(null);
                setIsSelecting(false);
                const startPoint = trendData[startIndex];
                const endPoint = trendData[endIndex];
                if (startPoint && endPoint && onTimeRangeSelect) {
                  onTimeRangeSelect({
                    from: new Date(startPoint.startMs),
                    to: new Date(endPoint.endMs),
                  });
                }
              }}
              onMouseLeave={() => {
                if (!isSelecting) return;
                setIsSelecting(false);
                setDragRange(null);
              }}
            />
          )}
        </div>
        {summary && (
          <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center justify-between">
              <span>Total tickets</span>
              <span className="font-semibold text-foreground">{summary.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg per bucket</span>
              <span className="font-semibold text-foreground">{summary.avgPerBucket.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Top source</span>
              <span className="font-semibold text-foreground">
                {summary.topSource
                  ? `${sourceConfig[summary.topSource[0] as keyof typeof sourceConfig]?.label ?? summary.topSource[0]} (${summary.topSource[1]})`
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Top issue type</span>
              <span className="font-semibold text-foreground">
                {summary.topIssueType
                  ? `${issueTypeConfig[summary.topIssueType[0] as keyof typeof issueTypeConfig]?.label ?? summary.topIssueType[0]} (${summary.topIssueType[1]})`
                  : '—'}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
